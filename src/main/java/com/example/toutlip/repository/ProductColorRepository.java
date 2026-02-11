package com.example.toutlip.repository;

import com.example.toutlip.domain.ProductColor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ProductColorRepository extends JpaRepository<ProductColor, Integer> {
    // 특정 제품에 속한 모든 컬러 상세 정보 조회 (Read)
    List<ProductColor> findAllByProductId(Integer productId);
}