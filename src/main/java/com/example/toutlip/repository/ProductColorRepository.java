package com.example.toutlip.repository;

import com.example.toutlip.domain.ProductColor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ProductColorRepository extends JpaRepository<ProductColor, Integer> {
    /**
     * 특정 제품(Product ID)에 속한 모든 컬러 상세 정보 조회
     */
    List<ProductColor> findAllByProductId(Integer productId);

    /**
     * 브랜드 이름별 전체 컬러칩 조회 (대소문자 무시)
     */
    List<ProductColor> findAllByProduct_Brand_NameIgnoreCase(String brandName);

    /**
     * [최적화] 브랜드 이름별 상위 20개 컬러칩만 조회 (대소문자 무시)
     * 속도 향상을 위해 Try-On 탭에서 이 메서드를 사용합니다.
     */
    List<ProductColor> findTop20ByProduct_Brand_NameIgnoreCase(String brandName);

    /**
     * 중복 저장 방지를 위한 Hex Code 존재 여부 확인
     */
    boolean existsByHexCode(String hexCode);
}