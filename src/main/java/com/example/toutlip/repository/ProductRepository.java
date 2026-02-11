package com.example.toutlip.repository;

import com.example.toutlip.domain.Product;
import com.example.toutlip.domain.ProductColor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Integer> {
    // 특정 브랜드에 속한 모든 제품 목록 조회 (Read)
    List<Product> findAllByBrandId(Integer brandId);
}