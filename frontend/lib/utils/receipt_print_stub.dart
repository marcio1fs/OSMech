import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';

import 'receipt_pdf.dart';

Future<void> printReceiptText(String receipt, String name, {String? logoUrl}) async {
  final pdfBytes = await buildReceiptPdfBytes(receipt, logoUrl: logoUrl);
  await Printing.layoutPdf(
    onLayout: (PdfPageFormat format) async => pdfBytes,
    name: name,
  );
}
