import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/upper_text.dart';

class RelatorioEstoqueTab extends StatefulWidget {
  final Map<String, dynamic>? relatorioValuationEstoque;
  final List<Map<String, dynamic>> relatorioEstoqueBaixo;
  final List<Map<String, dynamic>> relatorioMovimentacoes;
  final List<Map<String, dynamic>> todosItensEstoque;

  const RelatorioEstoqueTab({
    super.key,
    required this.relatorioValuationEstoque,
    required this.relatorioEstoqueBaixo,
    required this.relatorioMovimentacoes,
    required this.todosItensEstoque,
  });

  @override
  State<RelatorioEstoqueTab> createState() => _RelatorioEstoqueTabState();
}

class _RelatorioEstoqueTabState extends State<RelatorioEstoqueTab> {
  late final ScrollController _scrollEstoqueBaixo;
  late final ScrollController _scrollMovimentacoes;
  late final ScrollController _scrollTodosItens;

  @override
  void initState() {
    super.initState();
    _scrollEstoqueBaixo = ScrollController();
    _scrollMovimentacoes = ScrollController();
    _scrollTodosItens = ScrollController();
  }

  @override
  void dispose() {
    _scrollEstoqueBaixo.dispose();
    _scrollMovimentacoes.dispose();
    _scrollTodosItens.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasData = widget.relatorioValuationEstoque != null ||
        widget.relatorioEstoqueBaixo.isNotEmpty ||
        widget.relatorioMovimentacoes.isNotEmpty ||
        widget.todosItensEstoque.isNotEmpty;

    if (!hasData) {
      return _buildEmpty('Nenhum dado de estoque encontrado.');
    }

    String margemStr = '0.0%';
    if (widget.relatorioValuationEstoque != null) {
      final margemVal = widget.relatorioValuationEstoque!['margemEstimada'];
      if (margemVal != null) {
        final double? parsed = double.tryParse(margemVal.toString());
        if (parsed != null) {
          margemStr = '${parsed.toStringAsFixed(1)}%';
        }
      }
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.relatorioValuationEstoque != null) ...[
            _buildCard(
              title: 'Valuation de Estoque',
              icon: Icons.inventory_rounded,
              child: Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _buildStatCard(
                    'Itens Cadastrados',
                    '${widget.relatorioValuationEstoque!['totalItens'] ?? 0}',
                    Icons.inventory_2_rounded,
                    AppColors.info,
                  ),
                  _buildStatCard(
                    'Qtd. Total',
                    '${widget.relatorioValuationEstoque!['totalQuantidade'] ?? 0}',
                    Icons.layers_rounded,
                    AppColors.accentLight,
                  ),
                  _buildStatCard(
                    'Valor de Venda',
                    formatCurrency(widget.relatorioValuationEstoque!['valorTotalEstoque'] ?? 0),
                    Icons.sell_rounded,
                    AppColors.success,
                  ),
                  _buildStatCard(
                    'Custo Total',
                    formatCurrency(widget.relatorioValuationEstoque!['custoTotal'] ?? 0),
                    Icons.money_off_rounded,
                    AppColors.error,
                  ),
                  _buildStatCard(
                    'Margem Estimada',
                    margemStr,
                    Icons.trending_up_rounded,
                    AppColors.primary,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          if (widget.todosItensEstoque.isNotEmpty) ...[
            _buildCard(
              title: 'Posição Geral do Estoque',
              icon: Icons.inventory_2_rounded,
              child: _buildTodosItensTable(),
            ),
            const SizedBox(height: 24),
          ],

          if (widget.relatorioEstoqueBaixo.isNotEmpty) ...[
            _buildCard(
              title: 'Itens com Estoque Baixo',
              icon: Icons.warning_amber_rounded,
              child: _buildLowStockTable(),
            ),
            const SizedBox(height: 24),
          ],

          if (widget.relatorioMovimentacoes.isNotEmpty) ...[
            _buildCard(
              title: 'Movimentações de Estoque',
              icon: Icons.history_rounded,
              child: _buildMovementTable(),
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

  Widget _buildLowStockTable() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.3)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Scrollbar(
        controller: _scrollEstoqueBaixo,
        thumbVisibility: true,
        child: SingleChildScrollView(
          controller: _scrollEstoqueBaixo,
          scrollDirection: Axis.horizontal,
          child: DataTable(
            headingRowColor: WidgetStateProperty.all(AppColors.background.withValues(alpha: 0.6)),
            dataRowMinHeight: 44,
            dataRowMaxHeight: 52,
            columnSpacing: 28,
            columns: const [
              DataColumn(label: UpperText('Código', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Nome', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Categoria', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Qtd Atual', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Qtd Mínima', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Status', style: TextStyle(fontWeight: FontWeight.bold))),
            ],
            rows: widget.relatorioEstoqueBaixo.asMap().entries.map((entry) {
              final item = entry.value;
              final atual = item['quantidadeAtual'] ?? 0;
              final min = item['quantidadeMinima'] ?? 0;
              final isUnderMin = (atual as num) < (min as num);

              return DataRow(
                cells: [
                  DataCell(UpperText('${item['codigo'] ?? '-'}')),
                  DataCell(UpperText('${item['nome'] ?? '-'}')),
                  DataCell(UpperText('${item['categoria'] ?? '-'}')),
                  DataCell(UpperText('$atual')),
                  DataCell(UpperText('$min')),
                  DataCell(
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isUnderMin
                            ? AppColors.error.withValues(alpha: 0.12)
                            : AppColors.warning.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: isUnderMin ? AppColors.error.withValues(alpha: 0.4) : AppColors.warning.withValues(alpha: 0.4),
                          width: 1,
                        ),
                      ),
                      child: UpperText(
                        isUnderMin ? 'CRÍTICO' : 'ATENÇÃO',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: isUnderMin ? AppColors.error : AppColors.warning,
                        ),
                      ),
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  Widget _buildMovementTable() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.3)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Scrollbar(
        controller: _scrollMovimentacoes,
        thumbVisibility: true,
        child: SingleChildScrollView(
          controller: _scrollMovimentacoes,
          scrollDirection: Axis.horizontal,
          child: DataTable(
            headingRowColor: WidgetStateProperty.all(AppColors.background.withValues(alpha: 0.6)),
            dataRowMinHeight: 44,
            dataRowMaxHeight: 52,
            columnSpacing: 28,
            columns: const [
              DataColumn(label: UpperText('Item', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Código', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Tipo', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Qtd', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Anterior', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Atual', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Motivo', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Data', style: TextStyle(fontWeight: FontWeight.bold))),
            ],
            rows: widget.relatorioMovimentacoes.map((item) {
              final tipo = (item['tipoMovimentacao'] ?? '-').toString().toUpperCase();
              final isEntrada = tipo == 'ENTRADA' || tipo.contains('ENTRADA');
              final isSaida = tipo == 'SAIDA' || tipo == 'SAÍDA' || tipo.contains('SAIDA') || tipo.contains('SAÍDA');

              Color badgeColor = AppColors.textMuted;
              if (isEntrada) badgeColor = AppColors.success;
              if (isSaida) badgeColor = AppColors.error;

              return DataRow(
                cells: [
                  DataCell(UpperText('${item['itemNome'] ?? '-'}')),
                  DataCell(UpperText('${item['itemCodigo'] ?? '-'}')),
                  DataCell(
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: badgeColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: badgeColor.withValues(alpha: 0.4), width: 1),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isEntrada ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
                            size: 11,
                            color: badgeColor,
                          ),
                          const SizedBox(width: 4),
                          UpperText(
                            tipo,
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: badgeColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  DataCell(UpperText('${item['quantidade'] ?? 0}')),
                  DataCell(UpperText('${item['saldoAnterior'] ?? 0}')),
                  DataCell(UpperText('${item['saldoAtual'] ?? 0}')),
                  DataCell(UpperText('${item['motivo'] ?? '-'}')),
                  DataCell(UpperText(item['data'] != null ? formatDateBR(item['data'].toString()) : '-')),
                ],
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  Widget _buildTodosItensTable() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.3)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Scrollbar(
        controller: _scrollTodosItens,
        thumbVisibility: true,
        child: SingleChildScrollView(
          controller: _scrollTodosItens,
          scrollDirection: Axis.horizontal,
          child: DataTable(
            headingRowColor: WidgetStateProperty.all(AppColors.background.withValues(alpha: 0.6)),
            dataRowMinHeight: 44,
            dataRowMaxHeight: 52,
            columnSpacing: 28,
            columns: const [
              DataColumn(label: UpperText('Código', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Nome', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Categoria', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Qtd Atual', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Qtd Mínima', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Preço Custo', style: TextStyle(fontWeight: FontWeight.bold))),
              DataColumn(label: UpperText('Preço Venda', style: TextStyle(fontWeight: FontWeight.bold))),
            ],
            rows: widget.todosItensEstoque.map((item) {
              final atual = item['quantidade'] ?? 0;
              final min = item['quantidadeMinima'] ?? 0;
              final custo = item['precoCusto'] ?? 0;
              final venda = item['precoVenda'] ?? 0;

              return DataRow(
                cells: [
                  DataCell(UpperText('${item['codigo'] ?? '-'}')),
                  DataCell(UpperText('${item['nome'] ?? '-'}')),
                  DataCell(UpperText('${item['categoria'] ?? '-'}')),
                  DataCell(UpperText('$atual')),
                  DataCell(UpperText('$min')),
                  DataCell(UpperText(formatCurrency(custo))),
                  DataCell(UpperText(formatCurrency(venda))),
                ],
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
