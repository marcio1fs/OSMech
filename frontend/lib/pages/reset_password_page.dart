import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/upper_text.dart';

class ResetPasswordPage extends StatefulWidget {
  final String? token;
  const ResetPasswordPage({super.key, this.token});

  @override
  State<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends State<ResetPasswordPage> {
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _success = false;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final password = _passwordController.text;
    final confirm = _confirmPasswordController.text;
    final token = widget.token ?? '';

    if (password.length < 8) {
      setState(() => _error = 'A senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (password != confirm) {
      setState(() => _error = 'As senhas não coincidem');
      return;
    }
    if (token.isEmpty) {
      setState(() => _error = 'Token invalido ou ausente');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final err = await context.read<AuthService>().resetPassword(token, password);

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
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Form(
                  child: AutofillGroup(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                    const Icon(Icons.vpn_key_rounded, size: 48, color: AppColors.accent),
                    const SizedBox(height: 16),
                    UpperText('Nova Senha',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 32),
                    if (_success) ...[
                      const Icon(Icons.check_circle_outline_rounded, color: AppColors.success, size: 64),
                      const SizedBox(height: 16),
                      UpperText('Senha alterada com sucesso!',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.success)),
                      const SizedBox(height: 24),
                      FilledButton(
                        onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
                        child: const UpperText('Ir para o Login'),
                      ),
                    ] else ...[
                      if (_error != null)
                        Container(
                          padding: const EdgeInsets.all(12),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: AppColors.error.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: UpperText(_error!,
                              style: GoogleFonts.inter(color: AppColors.error, fontSize: 13)),
                        ),
                      TextField(
                        controller: _passwordController,
                        autofillHints: const [AutofillHints.newPassword],
                        decoration: const InputDecoration(
                          labelText: 'Nova Senha',
                          prefixIcon: Icon(Icons.lock_outline),
                        ),
                        obscureText: true,
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _confirmPasswordController,
                        autofillHints: const [AutofillHints.newPassword],
                        decoration: const InputDecoration(
                          labelText: 'Confirmar Nova Senha',
                          prefixIcon: Icon(Icons.lock_outline),
                        ),
                        obscureText: true,
                      ),
                      const SizedBox(height: 32),
                      FilledButton(
                        onPressed: _loading ? null : _submit,
                        child: _loading
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const UpperText('Alterar Senha'),
                      ),
                    ],
                  ],
                ),
              ),
              ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}