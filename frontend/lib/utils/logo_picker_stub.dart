class PickedLogo {
  final List<int> bytes;
  final String filename;

  PickedLogo({required this.bytes, required this.filename});
}

Future<PickedLogo?> pickLogoImage() async {
  throw UnsupportedError('Upload de logo disponivel apenas no navegador.');
}
