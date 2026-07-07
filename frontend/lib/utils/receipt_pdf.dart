import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

/// Constrói os bytes do PDF do recibo com logo (opcional) e mensagem de agradecimento.
Future<Uint8List> buildReceiptPdfBytes(String receipt, {String? logoUrl}) async {
  final pdfDocument = pw.Document();
  final receiptText = receipt.trimRight();

  // Remove quebras de linha excessivas e espaços em branco desnecessários
  final cleanReceiptText = receiptText
      .replaceAll(RegExp(r'\n{3,}'), '\n\n')
      .trim();

  // Tenta baixar a imagem do logo
  pw.MemoryImage? logoImage;
  if (logoUrl != null && logoUrl.isNotEmpty) {
    try {
      final response = await http.get(Uri.parse(logoUrl));
      if (response.statusCode == 200 && response.bodyBytes.isNotEmpty) {
        logoImage = pw.MemoryImage(response.bodyBytes);
      }
    } catch (_) {
      // Se falhar ao baixar o logo, continua sem ele
    }
  }

  pdfDocument.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      build: (pw.Context context) => [
        // Logo da oficina centralizado no topo
        if (logoImage != null)
          pw.Container(
            width: double.infinity,
            alignment: pw.Alignment.center,
            margin: const pw.EdgeInsets.only(bottom: 10),
            child: pw.Image(
              logoImage,
              height: 50,
              width: 120,
              fit: pw.BoxFit.contain,
            ),
          ),

        // Corpo do recibo
        pw.Container(
          width: double.infinity,
          padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: pw.BoxDecoration(
            border: pw.Border.all(color: PdfColors.grey500, width: 0.8),
          ),
          child: pw.Text(
            cleanReceiptText.isEmpty ? 'Recibo sem conteúdo.' : cleanReceiptText,
            style: pw.TextStyle(
              font: pw.Font.courier(),
              fontSize: 10.5,
              lineSpacing: 1.15,
              color: PdfColors.grey900,
            ),
          ),
        ),

        // Mensagem de agradecimento
        pw.SizedBox(height: 10),
        pw.Container(
          width: double.infinity,
          alignment: pw.Alignment.center,
          child: pw.Column(
            children: [
              pw.Divider(color: PdfColors.grey400, thickness: 0.5),
              pw.SizedBox(height: 6),
              pw.Text(
                'Agradecemos pela confiança e preferência!',
                style: pw.TextStyle(
                  font: pw.Font.courierBold(),
                  fontSize: 11.5,
                  color: PdfColors.grey800,
                ),
                textAlign: pw.TextAlign.center,
              ),
              pw.SizedBox(height: 2),
              pw.Text(
                'Seu veículo em boas mãos. Volte sempre!',
                style: pw.TextStyle(
                  font: pw.Font.courier(),
                  fontSize: 10.5,
                  color: PdfColors.grey600,
                ),
                textAlign: pw.TextAlign.center,
              ),
              pw.SizedBox(height: 6),
              pw.Divider(color: PdfColors.grey400, thickness: 0.5),
            ],
          ),
        ),
      ],
    ),
  );

  return pdfDocument.save();
}
