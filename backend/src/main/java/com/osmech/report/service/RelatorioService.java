package com.osmech.report.service;

import com.osmech.finance.entity.TransacaoFinanceira;
import com.osmech.finance.repository.TransacaoFinanceiraRepository;
import com.osmech.os.entity.OrdemServico;
import com.osmech.os.repository.OrdemServicoRepository;
import com.osmech.report.dto.*;
import com.osmech.stock.entity.StockItem;
import com.osmech.stock.entity.StockMovement;
import com.osmech.stock.repository.StockItemRepository;
import com.osmech.stock.repository.StockMovementRepository;
import com.osmech.user.entity.Usuario;
import com.osmech.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import java.awt.Color;
import java.util.ArrayList;

import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RelatorioService {

    private final OrdemServicoRepository osRepository;
    private final TransacaoFinanceiraRepository transacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final StockItemRepository stockItemRepository;
    private final StockMovementRepository stockMovementRepository;

    // ==================== TIPOS DE RELATÓRIO ====================

    public List<Map<String, String>> getTiposRelatorioOs() {
        return List.of(
            Map.of("codigo", "periodo", "nome", "OS por Período", "descricao", "Relatório geral de OS por período"),
            Map.of("codigo", "mecanico", "nome", "OS por Mecânico", "descricao", "Relatório de OS agrupadas por mecânico"),
            Map.of("codigo", "veiculo", "nome", "OS por Veículo", "descricao", "Relatório de OS agrupadas por veículo"),
            Map.of("codigo", "cliente", "nome", "OS por Cliente", "descricao", "Relatório de OS agrupadas por cliente")
        );
    }

    public List<Map<String, String>> getTiposRelatorioFinanceiro() {
        return List.of(
            Map.of("codigo", "receitas", "nome", "Receitas", "descricao", "Relatório de receitas por período"),
            Map.of("codigo", "despesas", "nome", "Despesas", "descricao", "Relatório de despesas por período"),
            Map.of("codigo", "caixa", "nome", "Fluxo de Caixa", "descricao", "Relatório de fluxo de caixa"),
            Map.of("codigo", "metodo", "nome", "Por Método de Pagamento", "descricao", "Receitas agrupadas por método")
        );
    }

    public List<Map<String, String>> getTiposRelatorioCliente() {
        return List.of(
            Map.of("codigo", "gastos", "nome", "Clientes por Gasto", "descricao", "Ranking de clientes por total gasto"),
            Map.of("codigo", "quantidade", "nome", "Clientes por OS", "descricao", "Ranking de clientes por quantidade de OS"),
            Map.of("codigo", "contatos", "nome", "Lista de Contatos", "descricao", "Lista de contatos de todos os clientes")
        );
    }

    public List<Map<String, String>> getTiposRelatorioEstoque() {
        return List.of(
            Map.of("codigo", "valuation", "nome", "Valuation", "descricao", "Valor total do estoque"),
            Map.of("codigo", "baixo", "nome", "Estoque Baixo", "descricao", "Itens com estoque abaixo do mínimo"),
            Map.of("codigo", "movimentacoes", "nome", "Movimentações", "descricao", "Histórico de movimentações de estoque")
        );
    }

    // ==================== RELATÓRIOS DE OS ====================

    public RelatorioOsResponse gerarRelatorioOsPorPeriodo(Long usuarioId, LocalDate inicio, LocalDate fim, String status) {
        LocalDateTime inicioDt = inicio.atStartOfDay();
        LocalDateTime fimDt = fim.atTime(23, 59, 59);

        List<OrdemServico> ordens = osRepository.findByUsuarioIdAndCriadoEmBetweenOrderByCriadoEmDesc(usuarioId, inicioDt, fimDt);
        
        if (status != null && !status.isEmpty()) {
            ordens = ordens.stream()
                .filter(os -> status.equals(os.getStatus()))
                .collect(Collectors.toList());
        }

        long total = ordens.size();
        long abertas = ordens.stream().filter(os -> "ABERTA".equals(os.getStatus())).count();
        long emAndamento = ordens.stream().filter(os -> "EM_ANDAMENTO".equals(os.getStatus())).count();
        long concluidas = ordens.stream().filter(os -> "CONCLUIDA".equals(os.getStatus())).count();
        long canceladas = ordens.stream().filter(os -> "CANCELADA".equals(os.getStatus())).count();

        BigDecimal valorTotal = ordens.stream()
            .map(OrdemServico::getValor)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal valorMedio = total > 0 
            ? valorTotal.divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP) 
            : BigDecimal.ZERO;

        return RelatorioOsResponse.builder()
            .dataInicio(inicio)
            .dataFim(fim)
            .totalOs(total)
            .osAbertas(abertas)
            .osEmAndamento(emAndamento)
            .osConcluidas(concluidas)
            .osCanceladas(canceladas)
            .valorTotal(valorTotal)
            .valorMedioOs(valorMedio)
            .detalhamento(ordens.stream().map(os -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", os.getId());
                map.put("cliente", os.getClienteNome());
                map.put("placa", os.getPlaca());
                map.put("modelo", os.getModelo());
                map.put("status", os.getStatus());
                map.put("valor", os.getValor());
                map.put("data", os.getCriadoEm());
                return map;
            }).collect(Collectors.toList()))
            .build();
    }

    public List<RelatorioOsPorMecanico> gerarRelatorioOsPorMecanico(Long usuarioId, LocalDate inicio, LocalDate fim) {
        LocalDateTime inicioDt = inicio.atStartOfDay();
        LocalDateTime fimDt = fim.atTime(23, 59, 59);

        List<OrdemServico> ordens = osRepository.findByUsuarioIdAndCriadoEmBetweenOrderByCriadoEmDesc(usuarioId, inicioDt, fimDt);

        return ordens.stream()
            .filter(os -> os.getMecanicoResponsavel() != null && !os.getMecanicoResponsavel().isEmpty())
            .collect(Collectors.groupingBy(OrdemServico::getMecanicoResponsavel))
            .entrySet().stream()
            .map(entry -> {
                List<OrdemServico> grupo = entry.getValue();
                BigDecimal total = grupo.stream()
                    .map(OrdemServico::getValor)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                long concluidas = grupo.stream()
                    .filter(os -> "CONCLUIDA".equals(os.getStatus()))
                    .count();
                
                return RelatorioOsPorMecanico.builder()
                    .mecanico(entry.getKey())
                    .totalOs((long) grupo.size())
                    .osConcluidas(concluidas)
                    .valorTotal(total)
                    .valorMedio(grupo.isEmpty() ? BigDecimal.ZERO : 
                        total.divide(BigDecimal.valueOf(grupo.size()), 2, RoundingMode.HALF_UP))
                    .build();
            })
            .sorted((a, b) -> b.getValorTotal().compareTo(a.getValorTotal()))
            .collect(Collectors.toList());
    }

    public List<RelatorioOsPorVeiculo> gerarRelatorioOsPorVeiculo(Long usuarioId, LocalDate inicio, LocalDate fim) {
        LocalDateTime inicioDt = inicio.atStartOfDay();
        LocalDateTime fimDt = fim.atTime(23, 59, 59);

        List<OrdemServico> ordens = osRepository.findByUsuarioIdAndCriadoEmBetweenOrderByCriadoEmDesc(usuarioId, inicioDt, fimDt);

        return ordens.stream()
            .filter(os -> os.getPlaca() != null && !os.getPlaca().isEmpty())
            .collect(Collectors.groupingBy(OrdemServico::getPlaca))
            .entrySet().stream()
            .map(entry -> {
                List<OrdemServico> grupo = entry.getValue();
                BigDecimal total = grupo.stream()
                    .map(OrdemServico::getValor)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                LocalDate ultima = grupo.stream()
                    .map(OrdemServico::getCriadoEm)
                    .filter(Objects::nonNull)
                    .map(LocalDateTime::toLocalDate)
                    .max(LocalDate::compareTo)
                    .orElse(null);
                
                return RelatorioOsPorVeiculo.builder()
                    .placa(entry.getKey())
                    .modelo(grupo.get(0).getModelo())
                    .montadora(grupo.get(0).getMontadora())
                    .totalOs((long) grupo.size())
                    .valorTotal(total)
                    .ultimaOs(ultima)
                    .build();
            })
            .sorted((a, b) -> b.getTotalOs().compareTo(a.getTotalOs()))
            .collect(Collectors.toList());
    }

    public List<RelatorioOsPorCliente> gerarRelatorioOsPorCliente(Long usuarioId, LocalDate inicio, LocalDate fim) {
        LocalDateTime inicioDt = inicio.atStartOfDay();
        LocalDateTime fimDt = fim.atTime(23, 59, 59);

        List<OrdemServico> ordens = osRepository.findByUsuarioIdAndCriadoEmBetweenOrderByCriadoEmDesc(usuarioId, inicioDt, fimDt);

        return ordens.stream()
            .filter(os -> os.getClienteNome() != null && !os.getClienteNome().isEmpty())
            .collect(Collectors.groupingBy(OrdemServico::getClienteNome))
            .entrySet().stream()
            .map(entry -> {
                List<OrdemServico> grupo = entry.getValue();
                BigDecimal total = grupo.stream()
                    .map(OrdemServico::getValor)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                LocalDate ultima = grupo.stream()
                    .map(OrdemServico::getCriadoEm)
                    .filter(Objects::nonNull)
                    .map(LocalDateTime::toLocalDate)
                    .max(LocalDate::compareTo)
                    .orElse(null);
                
                return RelatorioOsPorCliente.builder()
                    .clienteNome(entry.getKey())
                    .clienteCpf(grupo.get(0).getClienteCpf())
                    .clienteTelefone(grupo.get(0).getClienteTelefone())
                    .totalOs((long) grupo.size())
                    .valorTotal(total)
                    .ultimaOs(ultima)
                    .build();
            })
            .sorted((a, b) -> b.getValorTotal().compareTo(a.getValorTotal()))
            .collect(Collectors.toList());
    }

    // ==================== RELATÓRIOS FINANCEIROS ====================

    public RelatorioFinanceiroResponse gerarRelatorioReceitas(Long usuarioId, LocalDate inicio, LocalDate fim) {
        LocalDateTime inicioDt = inicio.atStartOfDay();
        LocalDateTime fimDt = fim.atTime(23, 59, 59);

        List<TransacaoFinanceira> transacoes = transacaoRepository
            .findByUsuarioIdAndDataMovimentacaoBetweenOrderByDataMovimentacaoDesc(usuarioId, inicioDt, fimDt)
            .stream()
            .filter(t -> "ENTRADA".equals(t.getTipo()))
            .collect(Collectors.toList());

        BigDecimal total = transacoes.stream()
            .map(TransacaoFinanceira::getValor)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return RelatorioFinanceiroResponse.builder()
            .dataInicio(inicio)
            .dataFim(fim)
            .totalReceitas(total)
            .totalTransacoes((long) transacoes.size())
            .transacoes(transacoes.stream().map(t -> 
                RelatorioFinanceiroResponse.TransacaoFinanceiraDTO.builder()
                    .id(t.getId())
                    .tipo(t.getTipo())
                    .descricao(t.getDescricao())
                    .valor(t.getValor())
                    .categoria(t.getCategoria() != null ? t.getCategoria().getNome() : null)
                    .metodoPagamento(t.getMetodoPagamento())
                    .data(t.getDataMovimentacao() != null ? t.getDataMovimentacao().toLocalDate() : null)
                    .build()
            ).collect(Collectors.toList()))
            .build();
    }

    public RelatorioDespesasResponse gerarRelatorioDespesas(Long usuarioId, LocalDate inicio, LocalDate fim) {
        LocalDateTime inicioDt = inicio.atStartOfDay();
        LocalDateTime fimDt = fim.atTime(23, 59, 59);

        List<TransacaoFinanceira> transacoes = transacaoRepository
            .findByUsuarioIdAndDataMovimentacaoBetweenOrderByDataMovimentacaoDesc(usuarioId, inicioDt, fimDt)
            .stream()
            .filter(t -> "SAIDA".equals(t.getTipo()))
            .collect(Collectors.toList());

        BigDecimal total = transacoes.stream()
            .map(TransacaoFinanceira::getValor)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return RelatorioDespesasResponse.builder()
            .dataInicio(inicio)
            .dataFim(fim)
            .totalDespesas(total)
            .totalTransacoes((long) transacoes.size())
            .despesas(transacoes.stream().map(t -> 
                RelatorioDespesasResponse.DespesaDTO.builder()
                    .id(t.getId())
                    .descricao(t.getDescricao())
                    .valor(t.getValor())
                    .categoria(t.getCategoria() != null ? t.getCategoria().getNome() : null)
                    .data(t.getDataMovimentacao() != null ? t.getDataMovimentacao().toLocalDate() : null)
                    .build()
            ).collect(Collectors.toList()))
            .build();
    }

    public RelatorioFluxoCaixaResponse gerarRelatorioFluxoCaixa(Long usuarioId, LocalDate inicio, LocalDate fim) {
        LocalDateTime inicioDt = inicio.atStartOfDay();
        LocalDateTime fimDt = fim.atTime(23, 59, 59);

        List<TransacaoFinanceira> todas = transacaoRepository
            .findByUsuarioIdAndDataMovimentacaoBetweenOrderByDataMovimentacaoDesc(usuarioId, inicioDt, fimDt);

        BigDecimal entradas = todas.stream()
            .filter(t -> "ENTRADA".equals(t.getTipo()))
            .map(TransacaoFinanceira::getValor)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal saidas = todas.stream()
            .filter(t -> "SAIDA".equals(t.getTipo()))
            .map(TransacaoFinanceira::getValor)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calcula movimentações diárias
        Map<LocalDate, BigDecimal> entradasPorDia = todas.stream()
            .filter(t -> "ENTRADA".equals(t.getTipo()))
            .collect(Collectors.groupingBy(
                t -> t.getDataMovimentacao().toLocalDate(),
                Collectors.reducing(BigDecimal.ZERO, TransacaoFinanceira::getValor, BigDecimal::add)
            ));

        Map<LocalDate, BigDecimal> saidasPorDia = todas.stream()
            .filter(t -> "SAIDA".equals(t.getTipo()))
            .collect(Collectors.groupingBy(
                t -> t.getDataMovimentacao().toLocalDate(),
                Collectors.reducing(BigDecimal.ZERO, TransacaoFinanceira::getValor, BigDecimal::add)
            ));

        List<RelatorioFluxoCaixaResponse.MovimentacaoDiaria> movimentacoes = new ArrayList<>();
        BigDecimal saldoAcumulado = BigDecimal.ZERO;

        for (LocalDate data = inicio; !data.isAfter(fim); data = data.plusDays(1)) {
            BigDecimal ent = entradasPorDia.getOrDefault(data, BigDecimal.ZERO);
            BigDecimal sai = saidasPorDia.getOrDefault(data, BigDecimal.ZERO);
            saldoAcumulado = saldoAcumulado.add(ent).subtract(sai);

            movimentacoes.add(RelatorioFluxoCaixaResponse.MovimentacaoDiaria.builder()
                .data(data)
                .entradas(ent)
                .saidas(sai)
                .saldoDia(ent.subtract(sai))
                .build());
        }

        return RelatorioFluxoCaixaResponse.builder()
            .dataInicio(inicio)
            .dataFim(fim)
            .saldoInicial(BigDecimal.ZERO)
            .totalEntradas(entradas)
            .totalSaidas(saidas)
            .saldoFinal(saldoAcumulado)
            .movimentacoes(movimentacoes)
            .build();
    }

    public List<RelatorioPorMetodoPagamento> gerarRelatorioPorMetodoPagamento(Long usuarioId, LocalDate inicio, LocalDate fim) {
        LocalDateTime inicioDt = inicio.atStartOfDay();
        LocalDateTime fimDt = fim.atTime(23, 59, 59);

        List<TransacaoFinanceira> transacoes = transacaoRepository
            .findByUsuarioIdAndDataMovimentacaoBetweenOrderByDataMovimentacaoDesc(usuarioId, inicioDt, fimDt)
            .stream()
            .filter(t -> "ENTRADA".equals(t.getTipo()))
            .collect(Collectors.toList());

        return transacoes.stream()
            .filter(t -> t.getMetodoPagamento() != null)
            .collect(Collectors.groupingBy(TransacaoFinanceira::getMetodoPagamento))
            .entrySet().stream()
            .map(entry -> {
                BigDecimal total = entry.getValue().stream()
                    .map(TransacaoFinanceira::getValor)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                return RelatorioPorMetodoPagamento.builder()
                    .metodoPagamento(entry.getKey())
                    .quantidade((long) entry.getValue().size())
                    .valorTotal(total)
                    .build();
            })
            .sorted((a, b) -> b.getValorTotal().compareTo(a.getValorTotal()))
            .collect(Collectors.toList());
    }

    // ==================== RELATÓRIOS DE CLIENTES ====================

    public List<RelatorioClienteGasto> gerarRelatorioClientesPorGasto(Long usuarioId, Integer limite) {
        int lim = limite != null ? limite : 50;
        
        // Pegar OS do usuário e agrupar por cliente
        List<OrdemServico> ordens = osRepository.findByUsuarioIdOrderByCriadoEmDesc(usuarioId);
        
        return ordens.stream()
            .filter(os -> os.getClienteNome() != null && !os.getClienteNome().isEmpty())
            .collect(Collectors.groupingBy(OrdemServico::getClienteNome))
            .entrySet().stream()
            .map(entry -> {
                List<OrdemServico> grupo = entry.getValue();
                BigDecimal total = grupo.stream()
                    .map(OrdemServico::getValor)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                return RelatorioClienteGasto.builder()
                    .clienteId(grupo.get(0).getId())
                    .nome(entry.getKey())
                    .telefone(grupo.get(0).getClienteTelefone())
                    .totalGasto(total)
                    .quantidadeOs((long) grupo.size())
                    .build();
            })
            .filter(r -> r.getTotalGasto().compareTo(BigDecimal.ZERO) > 0)
            .sorted((a, b) -> b.getTotalGasto().compareTo(a.getTotalGasto()))
            .limit(lim)
            .collect(Collectors.toList());
    }

    public List<RelatorioClienteQuantidadeOs> gerarRelatorioClientesPorQuantidadeOs(Long usuarioId, Integer limite) {
        int lim = limite != null ? limite : 50;
        
        // Pegar OS do usuário e agrupar por cliente
        List<OrdemServico> ordens = osRepository.findByUsuarioIdOrderByCriadoEmDesc(usuarioId);
        
        return ordens.stream()
            .filter(os -> os.getClienteNome() != null && !os.getClienteNome().isEmpty())
            .collect(Collectors.groupingBy(OrdemServico::getClienteNome))
            .entrySet().stream()
            .map(entry -> {
                List<OrdemServico> grupo = entry.getValue();
                BigDecimal total = grupo.stream()
                    .map(OrdemServico::getValor)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                LocalDate ultima = grupo.stream()
                    .map(OrdemServico::getCriadoEm)
                    .filter(Objects::nonNull)
                    .map(LocalDateTime::toLocalDate)
                    .max(LocalDate::compareTo)
                    .orElse(null);
                
                return RelatorioClienteQuantidadeOs.builder()
                    .clienteId(grupo.get(0).getId())
                    .nome(entry.getKey())
                    .telefone(grupo.get(0).getClienteTelefone())
                    .quantidadeOs((long) grupo.size())
                    .valorTotal(total)
                    .ultimaOs(ultima != null ? ultima.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : null)
                    .build();
            })
            .sorted((a, b) -> Long.compare(b.getQuantidadeOs(), a.getQuantidadeOs()))
            .limit(lim)
            .collect(Collectors.toList());
    }

    public List<RelatorioContatoCliente> gerarRelatorioContatos(Long usuarioId) {
        // Pegar OS do usuário e extrair contatos únicos de clientes
        List<OrdemServico> ordens = osRepository.findByUsuarioIdOrderByCriadoEmDesc(usuarioId);
        
        return ordens.stream()
            .filter(os -> os.getClienteNome() != null && !os.getClienteNome().isEmpty())
            .collect(Collectors.groupingBy(OrdemServico::getClienteNome))
            .entrySet().stream()
            .map(entry -> {
                OrdemServico primeiro = entry.getValue().get(0);
                return RelatorioContatoCliente.builder()
                    .clienteId(primeiro.getId())
                    .nome(entry.getKey())
                    .telefone(primeiro.getClienteTelefone())
                    .build();
            })
            .sorted(Comparator.comparing(RelatorioContatoCliente::getNome))
            .collect(Collectors.toList());
    }

    // ==================== RELATÓRIOS DE ESTOQUE ====================

    public RelatorioValuationEstoque gerarRelatorioValuationEstoque(Long usuarioId) {
        List<StockItem> itens = stockItemRepository.findByUsuarioIdOrderByNomeAsc(usuarioId);
        
        long totalItens = itens.size();
        long totalQuantidade = itens.stream()
            .mapToLong(i -> i.getQuantidade() != null ? i.getQuantidade() : 0)
            .sum();
        
        BigDecimal valorTotal = itens.stream()
            .map(i -> {
                BigDecimal preco = i.getPrecoVenda() != null ? i.getPrecoVenda() : BigDecimal.ZERO;
                BigDecimal qtd = BigDecimal.valueOf(i.getQuantidade() != null ? i.getQuantidade() : 0);
                return preco.multiply(qtd);
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal custoTotal = itens.stream()
            .map(i -> {
                BigDecimal custo = i.getPrecoCusto() != null ? i.getPrecoCusto() : BigDecimal.ZERO;
                BigDecimal qtd = BigDecimal.valueOf(i.getQuantidade() != null ? i.getQuantidade() : 0);
                return custo.multiply(qtd);
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal margem = BigDecimal.ZERO;
        if (custoTotal.compareTo(BigDecimal.ZERO) > 0) {
            margem = valorTotal.subtract(custoTotal)
                .divide(custoTotal, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        }

        return RelatorioValuationEstoque.builder()
            .totalItens(totalItens)
            .totalQuantidade(totalQuantidade)
            .valorTotalEstoque(valorTotal)
            .custoTotal(custoTotal)
            .margemEstimada(margem)
            .build();
    }

    public List<RelatorioEstoqueBaixo> gerarRelatorioEstoqueBaixo(Long usuarioId, Integer limite) {
        int lim = limite != null ? limite : 10;
        
        return stockItemRepository.findAlertItems(usuarioId).stream()
            .filter(i -> i.getQuantidade() != null && i.getQuantidadeMinima() != null)
            .map(i -> RelatorioEstoqueBaixo.builder()
                .id(i.getId())
                .nome(i.getNome())
                .codigo(i.getCodigo())
                .categoria(i.getCategoria())
                .quantidadeAtual(i.getQuantidade())
                .quantidadeMinima(i.getQuantidadeMinima())
                .build())
            .sorted(Comparator.comparingInt(RelatorioEstoqueBaixo::getQuantidadeAtual))
            .limit(lim)
            .collect(Collectors.toList());
    }

    public List<RelatorioMovimentacaoEstoque> gerarRelatorioMovimentacoes(Long usuarioId, LocalDate inicio, LocalDate fim) {
        LocalDateTime inicioDt = inicio.atStartOfDay();
        LocalDateTime fimDt = fim.atTime(23, 59, 59);

        return stockMovementRepository.findByPeriodo(usuarioId, inicioDt, fimDt).stream()
            .map(m -> {
                StockItem item = m.getStockItem();
                return RelatorioMovimentacaoEstoque.builder()
                    .id(m.getId())
                    .itemNome(item != null ? item.getNome() : null)
                    .itemCodigo(item != null ? item.getCodigo() : null)
                    .tipoMovimentacao(m.getTipo())
                    .quantidade(m.getQuantidade())
                    .saldoAnterior(m.getQuantidadeAnterior())
                    .saldoAtual(m.getQuantidadePosterior())
                    .motivo(m.getMotivo())
                    .data(m.getCriadoEm())
                    .build();
            })
            .sorted(Comparator.comparing(RelatorioMovimentacaoEstoque::getData).reversed())
            .collect(Collectors.toList());
    }

    // ==================== EXPORTAÇÃO ====================

    /**
     * Gera PDF real com dados do relatório solicitado.
     */
    public ByteArrayOutputStream exportarParaPdf(String tipo, LocalDate inicio, LocalDate fim, String formato) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            String csv = exportarParaCsv(tipo, inicio, fim);
            // Remove UTF-8 BOM if present
            if (csv.startsWith("\uFEFF")) {
                csv = csv.substring(1);
            }
            
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();
            
            // Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
            String titleText = String.format("Relatório de %s", tipo.toUpperCase());
            document.add(new Paragraph(titleText, titleFont));
            
            // Subtitle
            Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            String subText = String.format("Período: %s a %s | Gerado em: %s\n\n", 
                inicio != null ? inicio : "Início", 
                fim != null ? fim : "Fim", 
                LocalDate.now());
            document.add(new Paragraph(subText, subFont));
            
            // Table
            String[] lines = csv.split("\n");
            if (lines.length > 0) {
                String[] headers = parseCsvLine(lines[0]);
                PdfPTable table = new PdfPTable(headers.length);
                table.setWidthPercentage(100);
                
                // Headers styling
                Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
                for (String header : headers) {
                    PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                    cell.setBackgroundColor(new Color(249, 115, 22)); // Orange primary accent
                    cell.setPadding(6);
                    table.addCell(cell);
                }
                
                // Rows styling
                Font rowFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);
                for (int i = 1; i < lines.length; i++) {
                    if (lines[i].trim().isEmpty()) continue;
                    String[] cols = parseCsvLine(lines[i]);
                    for (int j = 0; j < headers.length; j++) {
                        String val = j < cols.length ? cols[j] : "";
                        PdfPCell cell = new PdfPCell(new Phrase(val, rowFont));
                        cell.setPadding(5);
                        // Alternating background colors
                        if (i % 2 == 0) {
                            cell.setBackgroundColor(new Color(241, 245, 249)); // Slate-100
                        }
                        table.addCell(cell);
                    }
                }
                document.add(table);
            }
            
            document.close();
        } catch (Exception e) {
            log.error("Erro ao gerar PDF", e);
        }
        return out;
    }

    /**
     * Gera Excel XLSX real com dados do relatório solicitado.
     */
    public ByteArrayOutputStream exportarParaExcel(String tipo, LocalDate inicio, LocalDate fim) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (Workbook workbook = new XSSFWorkbook()) {
            String csv = exportarParaCsv(tipo, inicio, fim);
            // Remove UTF-8 BOM if present
            if (csv.startsWith("\uFEFF")) {
                csv = csv.substring(1);
            }
            
            Sheet sheet = workbook.createSheet("Relatório");
            
            String[] lines = csv.split("\n");
            if (lines.length > 0) {
                // Header style
                CellStyle headerStyle = workbook.createCellStyle();
                headerStyle.setFillForegroundColor(IndexedColors.ORANGE.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setColor(IndexedColors.WHITE.getIndex());
                headerStyle.setFont(headerFont);
                
                // Row cell style
                CellStyle cellStyle = workbook.createCellStyle();
                cellStyle.setBorderBottom(BorderStyle.THIN);
                cellStyle.setBorderTop(BorderStyle.THIN);
                cellStyle.setBorderLeft(BorderStyle.THIN);
                cellStyle.setBorderRight(BorderStyle.THIN);
                
                String[] headers = parseCsvLine(lines[0]);
                Row headerRow = sheet.createRow(0);
                for (int j = 0; j < headers.length; j++) {
                    Cell cell = headerRow.createCell(j);
                    cell.setCellValue(headers[j]);
                    cell.setCellStyle(headerStyle);
                }
                
                for (int i = 1; i < lines.length; i++) {
                    if (lines[i].trim().isEmpty()) continue;
                    Row row = sheet.createRow(i);
                    String[] cols = parseCsvLine(lines[i]);
                    for (int j = 0; j < headers.length; j++) {
                        Cell cell = row.createCell(j);
                        String val = j < cols.length ? cols[j] : "";
                        cell.setCellValue(val);
                        cell.setCellStyle(cellStyle);
                    }
                }
                
                // Auto size columns
                for (int j = 0; j < headers.length; j++) {
                    sheet.autoSizeColumn(j);
                }
            }
            
            workbook.write(out);
        } catch (Exception e) {
            log.error("Erro ao gerar Excel", e);
        }
        return out;
    }

    private String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++; // skip next double quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',') {
                if (inQuotes) {
                    current.append(c);
                } else {
                    result.add(current.toString());
                    current.setLength(0);
                }
            } else {
                current.append(c);
            }
        }
        result.add(current.toString());
        return result.toArray(new String[0]);
    }

    public String exportarParaCsv(String tipo, LocalDate inicio, LocalDate fim) {
        // Busca o usuarioId a partir do contexto de segurança
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        Long uid = usuarioRepository.findByEmail(email).map(u -> u.getId()).orElse(null);
        if (uid == null) return "Usuário não encontrado\n";

        StringBuilder sb = new StringBuilder();
        sb.append("\uFEFF"); // BOM UTF-8 para Excel reconhecer acentos
        LocalDate ini = inicio != null ? inicio : LocalDate.now().withDayOfMonth(1);
        LocalDate fim2 = fim != null ? fim : LocalDate.now();

        switch (tipo.toLowerCase()) {
            case "os" -> {
                sb.append("ID,Cliente,Placa,Modelo,Status,Valor,Data\n");
                gerarRelatorioOsPorPeriodo(uid, ini, fim2, null).getDetalhamento()
                    .forEach(d -> sb.append(String.format("%s,%s,%s,%s,%s,%s,%s\n",
                        d.get("id"), csvEscape(d.get("cliente")), csvEscape(d.get("placa")),
                        csvEscape(d.get("modelo")), d.get("status"), d.get("valor"), d.get("data"))));
            }
            case "financeiro" -> {
                sb.append("Tipo,Descrição,Valor,Método,Data\n");
                gerarRelatorioReceitas(uid, ini, fim2).getTransacoes()
                    .forEach(t -> sb.append(String.format("%s,%s,%s,%s,%s\n",
                        t.getTipo(), csvEscape(t.getDescricao()), t.getValor(),
                        csvEscape(t.getMetodoPagamento()), t.getData())));
                gerarRelatorioDespesas(uid, ini, fim2).getDespesas()
                    .forEach(t -> sb.append(String.format("%s,%s,%s,%s,%s\n",
                        "DESPESA", csvEscape(t.getDescricao()), t.getValor(),
                        csvEscape(t.getCategoria()), t.getData())));
            }
            case "clientes" -> {
                sb.append("Cliente,Telefone,OS,Total Gasto\n");
                gerarRelatorioClientesPorGasto(uid, 1000)
                    .forEach(c -> sb.append(String.format("%s,%s,%s,%s\n",
                        csvEscape(c.getNome()), csvEscape(c.getTelefone()),
                        c.getQuantidadeOs(), c.getTotalGasto())));
            }
            case "estoque" -> {
                sb.append("Código,Nome,Categoria,Quantidade,Preço Custo,Preço Venda,Mínimo\n");
                stockItemRepository.findByUsuarioIdAndAtivoTrueOrderByNomeAsc(uid)
                    .forEach(i -> sb.append(String.format("%s,%s,%s,%s,%s,%s,%s\n",
                        csvEscape(i.getCodigo()), csvEscape(i.getNome()),
                        csvEscape(i.getCategoria()),
                        i.getQuantidade() != null ? i.getQuantidade() : 0,
                        i.getPrecoCusto() != null ? i.getPrecoCusto() : 0,
                        i.getPrecoVenda() != null ? i.getPrecoVenda() : 0,
                        i.getQuantidadeMinima() != null ? i.getQuantidadeMinima() : 0)));
            }
            default -> sb.append("Tipo de relatório não reconhecido: ").append(tipo).append("\n");
        }
        return sb.toString();
    }

    private String csvEscape(Object value) {
        if (value == null) return "";
        String s = value.toString().replace("\"", "\"\"");
        return s.contains(",") || s.contains("\n") ? "\"" + s + "\"" : s;
    }
}
