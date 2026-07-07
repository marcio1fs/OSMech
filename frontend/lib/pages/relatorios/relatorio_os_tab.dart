import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/upper_text.dart';

class RelatorioOsTab extends StatefulWidget {
  final Map<String, dynamic>? relatorioOsPeriodo;
  final List<Map<String, dynamic>> relatorioOsMecanico;
  final List<Map<String, dynamic>> relatorioOsVeiculo;
  final List<Map<String, dynamic>> relatorioOsCliente;

  const RelatorioOsTab({
    super.key,
    required this.relatorioOsPeriodo,
    required this.relatorioOsMecanico,
    required this.relatorioOsVeiculo,
    required this.relatorioOsCliente,
  });

  @override
  State<RelatorioOsTab> createState() => _RelatorioOsTabState();
}

class _RelatorioOsTabState extends State<RelatorioOsTab> {
  late final ScrollController _scrollMecanico;
  late final ScrollController _scrollVeiculo;
  late final ScrollController _scrollCliente;

  @override
  void initState() {
    super.initState();
    _scrollMecanico = ScrollController();
    _scrollVeiculo = ScrollController();
    _scrollCliente = ScrollController();
  }

  @override
  void dispose() {
    _scrollMecanico.dispose();
    _scrollVeiculo.dispose();
    _scrollCliente.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasData = widget.relatorioOsPeriodo != null ||
        widget.relatorioOsMecanico.isNotEmpty ||
        widget.relatorioOsVeiculo.isNotEmpty ||
        widget.relatorioOsCliente.isNotEmpty;

    if (!hasData) {
      return _buildEmpty('Nenhuma OS encontrada no período selecionado.');
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.relatorioOsPeriodo != null) ...[
            _buildCard(
              title: 'Resumo Geral de OS',
              icon: Icons.dashboard_customize_rounded,
              child: Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _buildStatCard(
                    'Total de OS',
                    '${widget.relatorioOsPeriodo!['totalOs'] ?? 0}',
                    Icons.assignment_rounded,
                    AppColors.primary,
                  ),
                  _buildStatCard(
                    'Abertas',
                    '${widget.relatorioOsPeriodo!['osAbertas'] ?? 0}',
                    Icons.lock_open_rounded,
                    AppColors.info,
                  ),
                  _buildStatCard(
                    'Em Andamento',
                    '${widget.relatorioOsPeriodo!['osEmAndamento'] ?? 0}',
                    Icons.play_arrow_rounded,
                    AppColors.warning,
                  ),
                  _buildStatCard(
                    'Concluídas',
                    '${widget.relatorioOsPeriodo!['osConcluidas'] ?? 0}',
                    Icons.check_circle_rounded,
                    AppColors.success,
                  ),
                  _buildStatCard(
                    'Canceladas',
                    '${widget.relatorioOsPeriodo!['osCanceladas'] ?? 0}',
                    Icons.cancel_rounded,
                    AppColors.error,
                  ),
                  _buildStatCard(
                    'Valor Total',
                    formatCurrency(widget.relatorioOsPeriodo!['valorTotal'] ?? 0),
                    Icons.attach_money_rounded,
                    AppColors.success,
                  ),
                  _buildStatCard(
                    'Ticket Médio',
                    formatCurrency(widget.relatorioOsPeriodo!['valorMedioOs'] ?? 0),
                    Icons.analytics_rounded,
                    AppColors.accentLight,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
          if (widget.relatorioOsMecanico.isNotEmpty) ...[
            _buildCard(
              title: 'Desempenho por Mecânico',
              icon: Icons.engineering_rounded,
              child: _buildDataTable(
                columns: const ['Mecânico', 'Total OS', 'Concluídas', 'Valor Total', 'Ticket Médio'],
                rows: widget.relatorioOsMecanico.map((item) => [
                  item['mecanico'] ?? '-',
                  '${item['totalOs'] ?? 0}',
                  '${item['osConcluidas'] ?? 0}',
                  formatCurrency(item['valorTotal'] ?? 0),
                  formatCurrency(item['valorMedio'] ?? 0),
                ]).toList(),
                controller: _scrollMecanico,
              ),
            ),
            const SizedBox(height: 24),
          ],
          if (widget.relatorioOsVeiculo.isNotEmpty) ...[
            _buildCard(
              title: 'OS por Veículo',
              icon: Icons.directions_car_filled_rounded,
              child: _buildDataTable(
                columns: const ['Placa', 'Modelo', 'Montadora', 'Total OS', 'Valor Total', 'Última OS'],
                rows: widget.relatorioOsVeiculo.map((item) => [
                  item['placa'] ?? '-',
                  item['modelo'] ?? '-',
                  item['montadora'] ?? '-',
                  '${item['totalOs'] ?? 0}',
                  formatCurrency(item['valorTotal'] ?? 0),
                  item['ultimaOs'] != null ? formatDateBR(item['ultimaOs'].toString()) : '-',
                ]).toList(),
                controller: _scrollVeiculo,
              ),
            ),
            const SizedBox(height: 24),
          ],
          if (widget.relatorioOsCliente.isNotEmpty) ...[
            _buildCard(
              title: 'OS por Cliente',
              icon: Icons.person_search_rounded,
              child: _buildDataTable(
                columns: const ['Cliente', 'Telefone', 'Total OS', 'Valor Total', 'Última OS'],
                rows: widget.relatorioOsCliente.map((item) => [
                  item['clienteNome'] ?? '-',
                  item['clienteTelefone'] ?? '-',
                  '${item['totalOs'] ?? 0}',
                  formatCurrency(item['valorTotal'] ?? 0),
                  item['ultimaOs'] != null ? formatDateBR(item['ultimaOs'].toString()) : '-',
                ]).toList(),
                controller: _scrollCliente,
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

  Widget _buildStatCard(String label, String value, IconData icon, Color iconColor) {
    return Container(
      width: 190,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.background.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                UpperText(
                  label,
                  style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: UpperText(
                    value,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDataTable({
    required List<String> columns,
    required List<List<dynamic>> rows,
    required ScrollController controller,
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
                cells: row
                    .map((cell) => DataCell(
                          UpperText(
                            '${cell ?? '-'}',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ))
                    .toList(),
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
