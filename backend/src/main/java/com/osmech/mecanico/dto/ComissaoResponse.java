package com.osmech.mecanico.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ComissaoResponse {
    private Long mecanicoId;
    private String mecanicoNome;
    private BigDecimal percentualComissao;
    private Integer mes;
    private Integer ano;
    private long quantidadeOsFinalizadas;
    private BigDecimal totalServicos;
    private BigDecimal totalPecas;
    private BigDecimal valorDescontos;
    private BigDecimal valorComissaoEstimada;
}
