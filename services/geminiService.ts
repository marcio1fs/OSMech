
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AIDiagnosisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const JSON_INSTRUCTION = `
      FORMATO DE RESPOSTA (JSON ESTRITO - SEM MARKDOWN):
      {
        "possibleCauses": [
          "Causa 1 (Alta Probabilidade)",
          "Causa 2 (Média Probabilidade)"
        ],
        "diagnosisSteps": [
          "Passo 1: Ação técnica",
          "Passo 2: Inspeção visual"
        ],
        "recommendedParts": [
          { "name": "Nome da Peça", "estimatedCost": 0.00 }
        ],
        "estimatedLaborHours": 0.0,
        "preventiveMaintenance": "Texto persuasivo de manutenção preventiva."
      }
`;

export const getMechanicDiagnosis = async (vehicle: string, complaint: string, mileage?: number): Promise<AIDiagnosisResult | null> => {
  try {
    const systemInstruction = `
      ATUE COMO: Engenheiro Mecânico Sênior e Especialista em Diagnóstico Automotivo.

      OBJETIVO:
      Analisar a queixa do cliente e dados do veículo para fornecer diagnóstico técnico.

      ETAPAS DE RACESIOCÍNIO:
      1. Analise os sintomas e ruídos.
      2. Cruze com defeitos crônicos do modelo ${vehicle}.
      3. Analise a Quilometragem (${mileage || 'N/A'} km) para desgaste natural.

      ${JSON_INSTRUCTION}
    `;

    const prompt = `
      DADOS DA ORDEM DE SERVIÇO:
      - Veículo: ${vehicle}
      - Quilometragem: ${mileage ? mileage + ' km' : 'Não informada'}
      - Relato: "${complaint}"
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4,
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
        let cleanText = response.text.trim();
        if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        return JSON.parse(cleanText) as AIDiagnosisResult;
    }
    return null;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return null;
  }
};

export const analyzePartImage = async (imageBase64: string, vehicleInfo: string): Promise<{ diagnosis: AIDiagnosisResult, description: string } | null> => {
    try {
        const prompt = `
            Analise esta imagem técnica automotiva referente ao veículo: ${vehicleInfo}.
            1. Identifique a peça ou componente visível.
            2. Identifique sinais visuais de desgaste, quebra, vazamento ou avaria.
            3. Gere um diagnóstico técnico estruturado e uma descrição curta do que foi visto na imagem para preencher o campo de "Reclamação/Defeito".
            
            Retorne um JSON contendo o objeto 'diagnosis' (com a estrutura padrão de AIDiagnosisResult) e um campo string 'description' resumindo o que foi visto na foto.
        `;
        
        // Remove header data:image/png;base64, if present for the API call logic if raw bytes needed, 
        // but GenAI SDK handles inlineData well usually with the base64 string directly if clean.
        // Ensuring clean base64 string:
        const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT" as any, // Using string enum for Type to avoid import issues if Type enum not available
                    properties: {
                         description: { type: "STRING" as any },
                         diagnosis: {
                             type: "OBJECT" as any,
                             properties: {
                                 possibleCauses: { type: "ARRAY" as any, items: { type: "STRING" as any } },
                                 diagnosisSteps: { type: "ARRAY" as any, items: { type: "STRING" as any } },
                                 recommendedParts: { 
                                     type: "ARRAY" as any, 
                                     items: { 
                                         type: "OBJECT" as any, 
                                         properties: { name: { type: "STRING" as any }, estimatedCost: { type: "NUMBER" as any } } 
                                     } 
                                 },
                                 estimatedLaborHours: { type: "NUMBER" as any },
                                 preventiveMaintenance: { type: "STRING" as any }
                             }
                         }
                    }
                }
            }
        });

        if (response.text) {
             return JSON.parse(response.text);
        }
        return null;

    } catch (error) {
        console.error("Error analyzing image:", error);
        return null;
    }
}

export const getShopAssistantChat = async (history: { role: 'user' | 'model', text: string }[], newMessage: string): Promise<string> => {
    try {
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "Você é o 'Mecânico Virtual' da OSMech. Sua função é ajudar a equipe da oficina com: 1. Códigos de falha (OBD-II). 2. Especificações técnicas (óleo, torque). 3. Dicas de gestão. Responda de forma técnica mas acessível."
            },
            history: history.map(h => ({
                role: h.role,
                parts: [{ text: h.text }]
            }))
        });

        const result: GenerateContentResponse = await chat.sendMessage({ message: newMessage });
        return result.text || "";
    } catch (error) {
        console.error("Chat error", error);
        return "Desculpe, estou processando muitas OSs no momento. Tente novamente em instantes.";
    }
}
