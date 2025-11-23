import { GoogleGenAI } from "@google/genai";
import { AIDiagnosisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMechanicDiagnosis = async (vehicle: string, complaint: string, mileage?: number): Promise<AIDiagnosisResult | null> => {
  try {
    const systemInstruction = `
      Você é o Agente de IA do sistema OSMech, um especialista sênior em mecânica automotiva e gestão de oficinas.
      
      OBJETIVO:
      Analise o veículo, a quilometragem (se informada) e a reclamação para fornecer um diagnóstico técnico.
      
      REGRAS DE RESPOSTA (JSON ESTRITO):
      - possibleCauses: Liste exatamente 3 prováveis causas, ORDENADAS POR PROBABILIDADE (da mais provável para a menos provável), simulando o histórico de defeitos comuns desse modelo.
      - diagnosisSteps: Passo a passo técnico para confirmar o defeito.
      - recommendedParts: Lista de peças com preço médio de mercado no Brasil (R$).
      - estimatedLaborHours: Tempo estimado de serviço baseado na complexidade.
      - preventiveMaintenance: SUGESTÃO CRÍTICA. Baseado na quilometragem e modelo, sugira uma manutenção preventiva que o mecânico deve oferecer (ex: Troca de correia dentada se > 50k km, Limpeza de bicos, etc).

      Se a quilometragem for alta, foque em desgaste natural. Se for baixa, foque em defeitos de fábrica ou mau uso.
    `;

    const prompt = `
      Veículo: ${vehicle}
      Quilometragem Atual: ${mileage ? mileage + ' km' : 'Não informada'}
      Reclamação do Cliente: ${complaint}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as AIDiagnosisResult;
    }
    return null;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return null;
  }
};

export const getShopAssistantChat = async (history: { role: 'user' | 'model', text: string }[], newMessage: string): Promise<string> => {
    try {
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "Você é um assistente virtual da oficina OSMech. Ajude com dúvidas técnicas, normas da ABNT para mecânica, preços de mercado aproximados e dicas de gestão. Seja conciso."
            },
            history: history.map(h => ({
                role: h.role,
                parts: [{ text: h.text }]
            }))
        });

        const result = await chat.sendMessage({ message: newMessage });
        return result.text || "";
    } catch (error) {
        console.error("Chat error", error);
        return "Desculpe, estou com dificuldades técnicas. Verifique a conexão.";
    }
}