// ignore_for_file: deprecated_member_use

import 'dart:async';
import 'dart:html' as html;

Future<void> printReceiptText(String receipt, String name, {String? logoUrl}) async {
  // Cria um iframe oculto posicionado fora da tela para evitar bloqueio de popups e garantir que renderize
  // Posicionado fora da tela mas com dimensões reais para que o navegador
  // renderize o conteúdo corretamente antes de chamar window.print().
  // width/height = 0px impede a renderização em vários browsers → página em branco.
  final iframe = html.IFrameElement()
    ..style.position = 'absolute'
    ..style.left = '-9999px'
    ..style.top = '-9999px'
    ..style.width = '800px'
    ..style.height = '600px'
    ..style.border = 'none'
    ..style.visibility = 'hidden';

  html.document.body?.append(iframe);

  final doc = iframe.contentWindow?.document;
  if (doc == null) {
    iframe.remove();
    throw Exception('Não foi possível obter o contexto de impressão do navegador.');
  }

  final htmlContent = _buildReceiptHtml(receipt, name, logoUrl: logoUrl);
  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Aguarda o carregamento do conteúdo no DOM do iframe
  await Future<void>.delayed(const Duration(milliseconds: 300));

  try {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  } catch (e) {
    throw Exception('Erro ao disparar a janela de impressão: $e');
  } finally {
    // Remove o iframe após o diálogo de impressão ter sido exibido
    Timer(const Duration(seconds: 15), () {
      iframe.remove();
    });
  }
}

String _buildReceiptHtml(String receipt, String name, {String? logoUrl}) {
  final escapedReceipt = _escapeHtml(receipt);
  final escapedName = _escapeHtml(name);
  final logoHtml = (logoUrl != null && logoUrl.isNotEmpty)
      ? '''
  <div style="text-align:center; margin-bottom: 10px;">
    <img src="$logoUrl"
         style="max-height:80px; max-width:180px; object-fit:contain;"
         onerror="this.style.display='none'">
  </div>'''
      : '';
  return '''
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>$escapedName</title>
  <style>
    @page { size: auto; margin: 8mm; }
    html, body { margin: 0; padding: 0; background: white; }
    body { font-family: "Courier New", monospace; font-size: 11px; line-height: 1.45; color: #111827; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>
  $logoHtml
  <pre>$escapedReceipt</pre>
</body>
</html>
''';
}

String _escapeHtml(String value) {
  return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
}

