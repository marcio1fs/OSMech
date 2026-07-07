import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/upper_text.dart';

class RelatorioFinanceiroTab extends StatefulWidget {
  final Map<String, dynamic>? relatorioReceitas;
  final Map<String, dynamic>? relatorioDespesas;
  final Map<String, dynamic>? relatorioFluxoCaixa;
  final List<Map<String, dynamic>> relatorioMetodoPagamento;

  const RelatorioFinanceiroTab({
    super.key,
    required this.relatorioReceitas,
    required this.relatorioDespesas,
    required this.relatorioFluxoCaixa,
    required this.relatorioMetodoPagamento,
  });

  @override
  State<RelatorioFinanceiroTab> createState() => _RelatorioFinanceiroTabState();
}

class _RelatorioFinanceiroTabState extends State<RelatorioFinanceiroTab> {
  late final ScrollController _scrollMetodoPagamento;

  @override
  void initState() {
    super.initState();
    _scrollMetodoPagamento = ScrollController();
  }

  @override
  void dispose() {
    _scrollMetodoPagamento.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasData = widget.relatorioReceitas != null ||
        widget.relatorioDespesas != null ||
        widget.relatorioFluxoCaixa != null ||
        widget.relatorioMetodoPagamento.isNotEmpty;

    if (!hasData) {
      return _buildEmpty('Nenhum dado financeiro encontrado no período selecionado.');
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Receitas e Despesas Row
          LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 700;
              final cards = [
                if (widget.relatorioReceitas != null)
                  Expanded(
                    flex: compact ? 0 : 1,
                    child: _buildFinancialCard(
                      title: 'Total de Receitas',
                      value: formatCurrency(widget.relatorioReceitas!['totalReceitas'] ?? 0),
                      subtitle: '${widget.relatorioReceitas!['totalTransacoes'] ?? 0} transações',
                      icon: Icons.arrow_upward_rounded,
                      glowColor: AppColors.success,
                    ),
                  ),
                if (!compact && widget.relatorioReceitas != null && widget.relatorioDespesas != null)
                  const SizedBox(width: 16),
                if (widget.relatorioDespesas != null)
                  Expanded(
                    flex: compact ? 0 : 1,
                    child: _buildFinancialCard(
                      title: 'Total de Despesas',
                      value: formatCurrency(widget.relatorioDespesas!['totalDespesas'] ?? 0),
                      subtitle: '${widget.relatorioDespesas!['totalTransacoes'] ?? 0} transações',
                      icon: Icons.arrow_downward_rounded,
                      glowColor: AppColors.error,
                    ),
                  ),
              ];

              if (compact) {
                return Column(
                  children: [
                    if (widget.relatorioReceitas != null) ...[
                      cards[0],
                      const SizedBox(height: 16),
                    ],
                    if (widget.relatorioDespesas != null) cards[widget.relatorioReceitas != null ? 1 : 0],
                  ],
                );
              }

              return Row(children: cards);
            },
          ),
          const SizedBox(height: 24),

          // Fluxo de Caixa Card
          if (widget.relatorioFluxoCaixa != null) ...[
            _buildCard(
              title: 'Fluxo de Caixa do Período',
              icon: Icons.swap_horiz_rounded,
              child: Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _buildStatCard(
                    'Saldo Inicial',
                    formatCurrency(widget.relatorioFluxoCaixa!['saldoInicial'] ?? 0),
                    Icons.account_balance_wallet_rounded,
                    AppColors.info,
                  ),
                  _buildStatCard(
                    'Total Entradas',
                    formatCurrency(widget.relatorioFluxoCaixa!['totalEntradas'] ?? 0),
                    Icons.trending_up_rounded,
                    AppColors.success,
                  ),
                  _buildStatCard(
                    'Total Saídas',
                    formatCurrency(widget.relatorioFluxoCaixa!['totalSaidas'] ?? 0),
                    Icons.trending_down_rounded,
                    AppColors.error,
                  ),
                  _buildStatCard(
                    'Saldo Final',
                    formatCurrency(widget.relatorioFluxoCaixa!['saldoFinal'] ?? 0),
                    Icons.savings_rounded,
                    AppColors.primary,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          // Metodo Pagamento Card
          if (widget.relatorioMetodoPagamento.isNotEmpty) ...[
            _buildCard(
              title: 'Distribuição por Método de Pagamento',
              icon: Icons.payments_rounded,
              child: _buildDataTable(
                columns: const ['Método de Pagamento', 'Quantidade', 'Valor Total'],
                rows: widget.relatorioMetodoPagamento.map((item) => [
                  item['metodoPagamento'] ?? '-',
                  '${item['quantidade'] ?? 0}',
                  formatCurrency(item['valorTotal'] ?? 0),
                ]).toList(),
                controller: _scrollMetodoPagamento,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFinancialCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color glowColor,
  }) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: glowColor.withValues(alpha: 0.35), width: 1.5),
        gradient: LinearGradient(
          colors: [
            AppColors.surface,
            glowColor.withValues(alpha: 0.08),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: glowColor.withValues(alpha: 0.05),
            blurRadius: 16,
            spreadRadius: 2,
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                UpperText(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: UpperText(
                    value,
                    style: GoogleFonts.inter(
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                      color: glowColor,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.query_builder, size: 12, color: AppColors.textMuted),
                    const SizedBox(width: 4),
                    UpperText(
                      subtitle,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: glowColor.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: glowColor, size: 24),
          ),
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
