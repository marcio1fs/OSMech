import 'dart:typed_data';

import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

Future<Uint8List> buildReceiptPdfBytes(String receipt) async {
  final pdfDocument = pw.Document();
  final receiptText = receipt.trimRight();

  pdfDocument.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.symmetric(horizontal: 28, vertical: 32),
      build: (pw.Context context) => [
        pw.Container(
          width: double.infinity,
          padding: const pw.EdgeInsets.all(14),
          decoration: pw.BoxDecoration(
            border: pw.Border.all(color: PdfColors.grey500, width: 0.8),
          ),
          child: pw.Text(
            receiptText.isEmpty ? 'Recibo sem conteúdo.' : receiptText,
            style: pw.TextStyle(
              font: pw.Font.courier(),
              fontSize: 9.5,
              lineSpacing: 2.2,
              color: PdfColors.grey900,
            ),
          ),
        ),
      ],
    ),
  );

  return pdfDocument.save();
}
