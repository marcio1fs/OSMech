import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import '../utils/jwt_utils.dart';

/// Exceção lançada quando há erro de conexão/rede.
class NetworkException implements Exception {
  final String message;
  NetworkException([this.message = 'Erro de conexão. Verifique sua internet.']);
  @override
  String toString() => message;
}

/// Exceção lançada quando o token JWT expirou ou é inválido (HTTP 401).
class UnauthorizedException implements Exception {
  final String message;
  UnauthorizedException(
      [this.message = 'Sessão expirada. Faça login novamente.']);
  @override
  String toString() => message;
}

/// Exceção lançada quando o acesso é proibido (HTTP 403).
class ForbiddenException implements Exception {
  final String message;
  ForbiddenException([this.message = 'Acesso negado.']);
  @override
  String toString() => message;
}

/// Exceção lançada quando o servidor retorna erro interno (HTTP 5xx).
class ServerException implements Exception {
  final String message;
  ServerException(
      [this.message = 'Erro interno do servidor. Tente novamente.']);
  @override
  String toString() => message;
}

/// Exceção lançada quando a requisição excede o timeout.
class ApiTimeoutException implements Exception {
  final String message;
  ApiTimeoutException(
      [this.message = 'Servidor demorou para responder. Tente novamente.']);
  @override
  String toString() => message;
}

/// Exceção lançada quando o recurso não foi encontrado (HTTP 404).
class NotFoundException implements Exception {
  final String message;
  NotFoundException([this.message = 'Recurso não encontrado.']);
  @override
  String toString() => message;
}

/// Exceção lançada quando há erro na requisição (HTTP 400).
class BadRequestException implements Exception {
  final String message;
  BadRequestException([this.message = 'Requisição inválida.']);
  @override
  String toString() => message;
}

/// Cliente HTTP centralizado com interceptor de autenticação.
/// Garante timeout consistente, headers padrão e detecção de erros HTTP.
/// Valida expiração do JWT ANTES de enviar cada requisição.
/// Implementa retry automático para falhas temporárias de rede.
class ApiClient {
  final String token;
  static const int maxRetries = 3;
  static const Duration retryDelay = Duration(milliseconds: 500);

  ApiClient({required this.token});

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

  Duration get _timeout => const Duration(seconds: ApiConfig.timeoutSeconds);

  /// Valida se o token ainda é válido antes de fazer a requisição.
  /// Lança [UnauthorizedException] se o token estiver expirado.
  void _validateToken() {
    if (JwtUtils.isExpired(token, bufferSeconds: 30)) {
      debugPrint('[ApiClient] Token expirado detectado antes da requisição.');
      throw UnauthorizedException('Sessão expirada. Faça login novamente.');
    }
  }

  /// Verifica códigos de erro HTTP e lança exceções específicas.
  void _checkResponse(http.Response response) {
    switch (response.statusCode) {
      case 400:
        String detail = 'Requisição inválida.';
        if (response.body.isNotEmpty) {
          try {
            final body = jsonDecode(response.body);
            if (body is Map && body['error'] != null) {
              detail = body['error'].toString();
            } else if (body is Map && body['message'] != null) {
              detail = body['message'].toString();
            }
          } catch (_) {}
        }
        throw BadRequestException(detail);
      case 401:
        throw UnauthorizedException();
      case 403:
        throw ForbiddenException();
      case 404:
        String detail = 'Recurso não encontrado.';
        if (response.body.isNotEmpty) {
          try {
            final body = jsonDecode(response.body);
            if (body is Map && body['error'] != null) {
              detail = body['error'].toString();
            } else if (body is Map && body['message'] != null) {
              detail = body['message'].toString();
            }
          } catch (_) {}
        }
        throw NotFoundException(detail);
      case 409:
        String detail = 'Conflito na operação.';
        if (response.body.isNotEmpty) {
          try {
            final body = jsonDecode(response.body);
            if (body is Map && body['error'] != null) {
              detail = body['error'].toString();
            }
          } catch (_) {}
        }
        throw BadRequestException(detail);
      case 422:
        String detail = 'Dados inválidos.';
        if (response.body.isNotEmpty) {
          try {
            final body = jsonDecode(response.body);
            if (body is Map && body['error'] != null) {
              detail = body['error'].toString();
            } else if (body is Map && body['message'] != null) {
              detail = body['message'].toString();
            }
          } catch (_) {}
        }
        throw BadRequestException(detail);
      case 500:
      case 502:
      case 503:
      case 504:
        String detail = 'Erro interno do servidor. Tente novamente.';
        if (response.body.isNotEmpty) {
          try {
            final body = jsonDecode(response.body);
            if (body is Map && body['detail'] != null) {
              detail = body['detail'].toString();
            } else if (body is Map && body['error'] != null) {
              detail = body['error'].toString();
            }
          } catch (_) {}
        }
        throw ServerException(detail);
    }
  }

  /// Wrapper para tratar TimeoutException e NetworkException com retry.
  Future<http.Response> _withTimeout(Future<http.Response> request) async {
    int attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        return await request.timeout(_timeout);
      } on TimeoutException {
        attempts++;
        debugPrint('[ApiClient] Timeout (tentativa $attempts/$maxRetries)');
        if (attempts >= maxRetries) {
          throw ApiTimeoutException();
        }
        await Future.delayed(retryDelay * attempts);
      } on http.ClientException catch (e) {
        // Erro de rede/conexão
        attempts++;
        debugPrint('[ApiClient] Erro de rede (tentativa $attempts/$maxRetries): ${e.message}');
        if (attempts >= maxRetries) {
          throw NetworkException('Erro de conexão. Verifique sua internet.');
        }
        await Future.delayed(retryDelay * attempts);
      }
    }
    
    throw ApiTimeoutException();
  }

  /// GET request com autenticação.
  Future<http.Response> get(String path,
      {Map<String, String>? queryParams}) async {
    _validateToken();
    final uri = Uri.parse('${ApiConfig.baseUrl}$path').replace(
        queryParameters:
            queryParams != null && queryParams.isNotEmpty ? queryParams : null);
    final response = await _withTimeout(http.get(uri, headers: _headers));
    _checkResponse(response);
    return response;
  }

  /// POST request com autenticação.
  Future<http.Response> post(String path, {Object? body}) async {
    _validateToken();
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    final response = await _withTimeout(http.post(uri,
        headers: _headers, body: body != null ? jsonEncode(body) : null));
    _checkResponse(response);
    return response;
  }

  /// PUT request com autenticação.
  Future<http.Response> put(String path, {Object? body}) async {
    _validateToken();
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    final response = await _withTimeout(http.put(uri,
        headers: _headers, body: body != null ? jsonEncode(body) : null));
    _checkResponse(response);
    return response;
  }

  /// PATCH request com autenticação (atualizações parciais).
  Future<http.Response> patch(String path, {Object? body}) async {
    _validateToken();
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    final response = await _withTimeout(http.patch(uri,
        headers: _headers, body: body != null ? jsonEncode(body) : null));
    _checkResponse(response);
    return response;
  }

  /// DELETE request com autenticação.
  Future<http.Response> delete(String path) async {
    _validateToken();
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    final response = await _withTimeout(http.delete(uri, headers: _headers));
    _checkResponse(response);
    return response;
  }
}
