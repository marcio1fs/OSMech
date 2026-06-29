import 'package:flutter/foundation.dart';

/// Configuracoes globais da API.
class ApiConfig {
  /// URL base da API.
  /// Pode ser definida via --dart-define=API_URL=...
  /// Fallback:
  /// - Web/iOS/Desktop: 127.0.0.1 (evita problemas de resolucao IPv6)
  /// - Android emulador: 10.0.2.2 (host machine loopback)
  static String get baseUrl {
    const definedUrl = String.fromEnvironment('API_URL', defaultValue: '');
    if (definedUrl.isNotEmpty) return definedUrl;

    // Para rodar localmente antes do VPS, use: --dart-define=API_URL=http://127.0.0.1:8081
    // (os serviços já chamam paths iniciando com /api/...)
    if (kIsWeb) return 'http://127.0.0.1:8081';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:8081';
    }
    return 'http://127.0.0.1:8081';
  }


  /// Constrói URL absoluta para recursos servidos pela API.
  /// Se `value` já for URL completa, apenas retorna.
  static String absoluteUrl(String value) {
    final v = value.trim();
    if (v.startsWith('http://') || v.startsWith('https://')) return v;
    if (v.startsWith('/')) return '${baseUrl}${v}';
    return '${baseUrl}/$v';
  }

  // Timeout padrao em segundos
  static const int timeoutSeconds = 30;
}

