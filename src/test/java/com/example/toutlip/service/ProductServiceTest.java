package com.example.toutlip.service;

import com.example.toutlip.domain.Brand;
import com.example.toutlip.domain.Product;
import com.example.toutlip.dto.ProductDTO;
import com.example.toutlip.repository.BrandRepository;
import com.example.toutlip.repository.ProductRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class ProductServiceTest {
    @Autowired private ProductService productService;
    @Autowired
    private BrandRepository brandRepository;
    @Autowired private ProductRepository productRepository;

    @Test
    @DisplayName("[Product] 제품 조회 CRUD: 브랜드와 제품, 컬러의 계층적 조회 확인")
    void productSearchCrud() {
        // 1. Create: 브랜드 및 제품 생성
        Brand brand = new Brand();
        brand.setName("ToutLip");
        brandRepository.save(brand);

        Product product = new Product();
        product.setName("시그니처 립");
        product.setBrand(brand);
        productRepository.save(product);

        // 2. Read: 브랜드 ID 기반 제품 목록 조회
        List<ProductDTO.ProductResponseDTO> products = productService.findAllProductsByBrand(brand.getId());

        // 3. Verify
        assertThat(products).hasSize(1);
        assertThat(products.get(0).getName()).isEqualTo("시그니처 립");
    }
}