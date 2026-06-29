// ignore_for_file: deprecated_member_use

import 'dart:async';
import 'dart:html' as html;
import 'dart:typed_data';

class PickedLogo {
  final List<int> bytes;
  final String filename;

  PickedLogo({required this.bytes, required this.filename});
}

Future<PickedLogo?> pickLogoImage() async {
  final input = html.FileUploadInputElement()
    ..accept = 'image/png,image/jpeg,image/webp';
  input.click();

  final change = await input.onChange.first;
  final files = (change.target as html.FileUploadInputElement).files;
  if (files == null || files.isEmpty) return null;

  final file = files.first;
  final reader = html.FileReader();
  final completer = Completer<Uint8List>();

  reader.onLoad.first.then((_) {
    final result = reader.result;
    if (result is ByteBuffer) {
      completer.complete(Uint8List.view(result));
    } else if (result is Uint8List) {
      completer.complete(result);
    } else if (result is List<int>) {
      completer.complete(Uint8List.fromList(result));
    } else {
      completer.completeError('Falha ao ler imagem.');
    }
  });
  reader.onError.first.then((_) => completer.completeError('Falha ao ler imagem.'));
  reader.readAsArrayBuffer(file);

  return PickedLogo(bytes: await completer.future, filename: file.name);
}
