import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/upper_text.dart';

class VerifyEmailPage extends StatefulWidget {
  final String? token;
  const VerifyEmailPage({super.key, this.token});

  @override
  State<VerifyEmailPage> createState() => _VerifyEmailPageState();
}

class _VerifyEmailPageState extends State<VerifyEmailPage> {
  bool _loading = true;
  String? _error;
  bool _success = false;

  @override
  void initState() {
    super.initState();
    _verify();
  }

  Future<void> _verify() async {
    final token = widget.token;
    if (token == null || token.isEmpty) {
      setState(() {
        _loading = false;
        _error = 'Token de verificação ausente.';
      });
      return;
    }

    final err = await context.read<AuthService>().verifyEmail(token);

    if (mounted) {
      setState(() {
        _loading = false;
        if (err == null) {
          _success = true;
        } else {
          _error = err;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Container(
          width: 450,
          padding: const EdgeInsets.all(40),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_loading) ...[
                const CircularProgressIndicator(),
                const SizedBox(height: 24),
                UpperText('Verificando seu e-mail...', style: GoogleFonts.inter(fontSize: 16)),
              ] else if (_success) ...[
                const Icon(Icons.verified_user_rounded, color: AppColors.success, size: 80),
                const SizedBox(height: 24),
                UpperText('E-mail verificado!',
                    style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.success)),
                const SizedBox(height: 16),
                UpperText('Sua conta agora está ativa e pronta para uso.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(fontSize: 16, color: AppColors.textSecondary)),
                const SizedBox(height: 32),
                FilledButton(
                  onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
                  child: const UpperText('Fazer Login Agora'),
                ),
              ] else ...[
                const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 80),
                const SizedBox(height: 24),
                UpperText('Ops! Algo deu errado',
                    style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.error)),
                const SizedBox(height: 16),
                UpperText(_error ?? 'O link de verificação é inválido ou expirou.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(fontSize: 16, color: AppColors.textSecondary)),
                const SizedBox(height: 32),
                FilledButton(
                  onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
                  child: const UpperText('Voltar para o Login'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
