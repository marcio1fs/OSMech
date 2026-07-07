// ignore_for_file: deprecated_member_use

import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';

import 'receipt_pdf.dart';

/// Imprime o recibo gerando um PDF real via a biblioteca `printing`,
/// que abre o diálogo nativo de impressão do navegador com o documento
/// formatado corretamente (em vez de tirar print da tela HTML).
Future<void> printReceiptText(String receipt, String name, {String? logoUrl}) async {
  final pdfBytes = await buildReceiptPdfBytes(receipt, logoUrl: logoUrl);
  await Printing.layoutPdf(
    onLayout: (PdfPageFormat format) async => pdfBytes,
    name: name,
  );
}
