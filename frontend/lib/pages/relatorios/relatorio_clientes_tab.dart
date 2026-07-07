import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/upper_text.dart';

class RelatorioClientesTab extends StatefulWidget {
  final List<Map<String, dynamic>> relatorioClientesGasto;
  final List<Map<String, dynamic>> relatorioClientesQuantidade;
  final List<Map<String, dynamic>> relatorioContatos;

  const RelatorioClientesTab({
    super.key,
    required this.relatorioClientesGasto,
    required this.relatorioClientesQuantidade,
    required this.relatorioContatos,
  });

  @override
  State<RelatorioClientesTab> createState() => _RelatorioClientesTabState();
}

class _RelatorioClientesTabState extends State<RelatorioClientesTab> {
  late final ScrollController _scrollClientesGasto;
  late final ScrollController _scrollClientesQuantidade;
  late final ScrollController _scrollContatos;

  @override
  void initState() {
    super.initState();
    _scrollClientesGasto = ScrollController();
    _scrollClientesQuantidade = ScrollController();
    _scrollContatos = ScrollController();
  }

  @override
  void dispose() {
    _scrollClientesGasto.dispose();
    _scrollClientesQuantidade.dispose();
    _scrollContatos.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasData = widget.relatorioClientesGasto.isNotEmpty ||
        widget.relatorioClientesQuantidade.isNotEmpty ||
        widget.relatorioContatos.isNotEmpty;

    if (!hasData) {
      return _buildEmpty('Nenhum dado de clientes encontrado.');
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.relatorioClientesGasto.isNotEmpty) ...[
            _buildCard(
              title: 'Clientes por Gasto Total',
              icon: Icons.monetization_on_rounded,
              child: _buildDataTable(
                columns: const ['#', 'Cliente', 'Telefone', 'OS', 'Total Gasto'],
                rows: widget.relatorioClientesGasto.asMap().entries.map((e) => [
                  e.key + 1,
                  e.value['nome'] ?? '-',
                  e.value['telefone'] ?? '-',
                  '${e.value['quantidadeOs'] ?? 0}',
                  formatCurrency(e.value['totalGasto'] ?? 0),
                ]).toList(),
                useRankBadge: true,
                controller: _scrollClientesGasto,
              ),
            ),
            const SizedBox(height: 24),
          ],
          if (widget.relatorioClientesQuantidade.isNotEmpty) ...[
            _buildCard(
              title: 'Clientes por Quantidade de OS',
              icon: Icons.assignment_ind_rounded,
              child: _buildDataTable(
                columns: const ['#', 'Cliente', 'Telefone', 'OS', 'Valor Total', 'Última OS'],
                rows: widget.relatorioClientesQuantidade.asMap().entries.map((e) => [
                  e.key + 1,
                  e.value['nome'] ?? '-',
                  e.value['telefone'] ?? '-',
                  '${e.value['quantidadeOs'] ?? 0}',
                  formatCurrency(e.value['valorTotal'] ?? 0),
                  e.value['ultimaOs'] != null ? formatDateBR(e.value['ultimaOs'].toString()) : '-',
                ]).toList(),
                useRankBadge: true,
                controller: _scrollClientesQuantidade,
              ),
            ),
            const SizedBox(height: 24),
          ],
          if (widget.relatorioContatos.isNotEmpty) ...[
            _buildCard(
              title: 'Lista Geral de Contatos',
              icon: Icons.contact_phone_rounded,
              child: _buildDataTable(
                columns: const ['Cliente', 'Telefone'],
                rows: widget.relatorioContatos.map((item) => [
                  item['nome'] ?? '-',
                  item['telefone'] ?? '-',
                ]).toList(),
                controller: _scrollContatos,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCard({required String title, required Widget child, required IconData icon}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Icon(icon, color: AppColors.primary, size: 22),
                const SizedBox(width: 10),
                Expanded(
                  child: UpperText(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.border),
          Padding(
            padding: const EdgeInsets.all(20),
            child: child,
          ),
        ],
      ),
    );
  }

  Widget _buildRankBadge(int rank) {
    Color badgeColor;
    Color textColor = Colors.white;
    switch (rank) {
      case 1:
        badgeColor = const Color(0xFFFFD700); // Ouro
        textColor = Colors.black87;
        break;
      case 2:
        badgeColor = const Color(0xFFC0C0C0); // Prata
        textColor = Colors.black87;
        break;
      case 3:
        badgeColor = const Color(0xFFCD7F32); // Bronze
        textColor = Colors.white;
        break;
      default:
        badgeColor = AppColors.border;
        textColor = AppColors.textSecondary;
    }
    return Container(
      width: 24,
      height: 24,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: badgeColor,
        shape: BoxShape.circle,
      ),
      child: Text(
        '$rank',
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildDataTable({
    required List<String> columns,
    required List<List<dynamic>> rows,
    required ScrollController controller,
    bool useRankBadge = false,
  }) {
    if (rows.isEmpty) return _buildEmpty('Sem dados para exibir.');
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.3)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Scrollbar(
        controller: controller,
        thumbVisibility: true,
        child: SingleChildScrollView(
          controller: controller,
          scrollDirection: Axis.horizontal,
          child: DataTable(
            headingRowColor: WidgetStateProperty.all(AppColors.background.withValues(alpha: 0.6)),
            dataRowMinHeight: 44,
            dataRowMaxHeight: 52,
            columnSpacing: 28,
            columns: columns
                .map((c) => DataColumn(
                      label: UpperText(
                        c,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ))
                .toList(),
            rows: rows.asMap().entries.map((entry) {
              final row = entry.value;
              return DataRow(
                cells: row.asMap().entries.map((cellEntry) {
                  final cellIdx = cellEntry.key;
                  final cellVal = cellEntry.value;

                  if (useRankBadge && cellIdx == 0 && cellVal is int) {
                    return DataCell(
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: _buildRankBadge(cellVal),
                      ),
                    );
                  }

                  return DataCell(
                    UpperText(
                      '$cellVal',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  );
                }).toList(),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty(String msg) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.inbox_rounded, size: 48, color: AppColors.textMuted.withValues(alpha: 0.5)),
            const SizedBox(height: 12),
            UpperText(
              msg,
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}
