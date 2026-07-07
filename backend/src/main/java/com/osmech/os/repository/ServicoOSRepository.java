package com.osmech.os.repository;

import com.osmech.os.entity.ServicoOS;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ServicoOSRepository extends JpaRepository<ServicoOS, Long> {

    /** Busca serviços de uma OS */
    List<ServicoOS> findByOrdemServicoId(Long ordemServicoId);

    /** Remove todos os serviços de uma OS */
    void deleteByOrdemServicoId(Long ordemServicoId);

    @Query("SELECT COALESCE(SUM(s.valorComissao), 0) FROM ServicoOS s WHERE s.mecanicoId = :mecanicoId AND s.ordemServico.status = 'CONCLUIDA'")
    BigDecimal sumComissaoByMecanicoId(@Param("mecanicoId") Long mecanicoId);
}
