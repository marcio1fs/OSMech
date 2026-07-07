import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../widgets/upper_text.dart';

class OsSectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  const OsSectionHeader({super.key, required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.accent),
        const SizedBox(width: 10),
        Expanded(
          child: UpperText(title,
              style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary)),
        ),
      ],
    );
  }
}

class OsCardSection extends StatelessWidget {
  final List<Widget> children;
  const OsCardSection({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
          crossAxisAlignment: CrossAxisAlignment.start, children: children),
    );
  }
}

class OsMontadoraField extends StatelessWidget {
  final TextEditingController controller;
  final List<String> opcoes;
  final VoidCallback onCarregar;

  const OsMontadoraField({
    super.key,
    required this.controller,
    required this.opcoes,
    required this.onCarregar,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        UpperText('Montadora',
            style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary)),
        const SizedBox(height: 8),
        Autocomplete<String>(
          initialValue: TextEditingValue(text: controller.text),
          optionsBuilder: (textEditingValue) {
            onCarregar();
            final query = textEditingValue.text.trim().toLowerCase();
            if (query.isEmpty) return opcoes;
            return opcoes.where(
                (m) => m.toLowerCase().contains(query));
          },
          onSelected: (value) => controller.text = value,
          fieldViewBuilder: (ctx, fieldController, focusNode, onSubmit) {
            // Sincroniza o controller externo com o interno do Autocomplete
            fieldController.text = controller.text;
            fieldController.addListener(() {
              controller.text = fieldController.text;
            });
            return TextFormField(
              controller: fieldController,
              focusNode: focusNode,
              textCapitalization: TextCapitalization.characters,
              inputFormatters: [UpperCaseTextFormatter()],
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                suffixIcon: Icon(Icons.arrow_drop_down_rounded),
              ),
              onFieldSubmitted: (_) => onSubmit(),
            );
          },
          optionsViewBuilder: (ctx, onSelected, options) {
            return Align(
              alignment: Alignment.topLeft,
              child: Material(
                elevation: 4,
                borderRadius: BorderRadius.circular(10),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxHeight: 240, maxWidth: 280),
                  child: ListView.builder(
                    padding: EdgeInsets.zero,
                    shrinkWrap: true,
                    itemCount: options.length,
                    itemBuilder: (_, i) {
                      final opt = options.elementAt(i);
                      return InkWell(
                        onTap: () => onSelected(opt),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 10),
                          child: UpperText(opt,
                              style: GoogleFonts.inter(
                                  fontSize: 14,
                                  color: AppColors.textPrimary)),
                        ),
                      );
                    },
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

class OsField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final bool required;
  final int maxLines;
  final TextInputType? keyboard;
  final VoidCallback? onChanged;
  final VoidCallback? onTap;
  final bool readOnly;
  final Widget? suffixIcon;
  final String? Function(String?)? validator;
  final List<TextInputFormatter>? inputFormatters;
  final String? hintText;
  const OsField(
      {super.key,
      required this.label,
      required this.controller,
      this.required = false,
      this.maxLines = 1,
      this.keyboard,
      this.onChanged,
      this.onTap,
      this.readOnly = false,
      this.suffixIcon,
      this.validator,
      this.inputFormatters,
      this.hintText});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        UpperText(label,
            style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboard,
          textCapitalization: TextCapitalization.characters,
          inputFormatters: [
            UpperCaseTextFormatter(),
            ...?inputFormatters,
          ],
          textInputAction:
              maxLines == 1 ? TextInputAction.next : TextInputAction.newline,
          readOnly: readOnly,
          onTap: onTap,
          onFieldSubmitted: (_) {
            if (maxLines == 1) {
              FocusScope.of(context).nextFocus();
            }
          },
          decoration: InputDecoration(suffixIcon: suffixIcon, hintText: hintText),
          onChanged: onChanged != null ? (_) => onChanged!() : null,
          validator: validator ??
              (required
                  ? (v) => v == null || v.isEmpty ? 'Campo obrigatório' : null
                  : null),
        ),
      ],
    );
  }
}

class UpperCaseTextFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    return TextEditingValue(
      text: newValue.text.toUpperCase(),
      selection: newValue.selection,
    );
  }
}
