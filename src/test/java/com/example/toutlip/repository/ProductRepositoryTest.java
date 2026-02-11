package com.example.toutlip.repository;

import com.example.toutlip.domain.Brand;
import com.example.toutlip.domain.Product;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ProductRepositoryTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BrandRepository brandRepository;

    // 1. [Create] 제품 등록 및 관계 설정 검증
    @Test
    @DisplayName("제품 생성: 브랜드와 연결된 제품이 DB에 정상적으로 저장되는지 확인")
    void createProductWithBrand() {
        // given
        Brand brand = new Brand();
        brand.setName("ToutLip Brand");
        brandRepository.save(brand);

        Product product = new Product();
        product.setName("신상 립스틱");
        product.setBrand(brand);

        // when
        Product savedProduct = productRepository.save(product);

        // then
        assertThat(savedProduct.getId()).isNotNull();
        assertThat(savedProduct.getBrand().getName()).isEqualTo("ToutLip Brand");
    }

    // 2. [Read] 특정 조건(브랜드 ID) 기반 조회 검증
    @Test
    @DisplayName("제품 조회: 특정 브랜드 ID를 가진 제품들만 필터링하여 가져오는지 확인")
    void readProductsByBrandId() {
        // given
        Brand brand = new Brand();
        brand.setName("샤넬");
        brandRepository.save(brand);

        Product product = new Product();
        product.setName("루쥬 알뤼르");
        product.setBrand(brand);
        productRepository.save(product);

        // when
        List<Product> products = productRepository.findAllByBrandId(brand.getId());

        // then
        assertThat(products).hasSize(1);
        assertThat(products.get(0).getName()).isEqualTo("루쥬 알뤼르");
    }

    // 3. [Update] 제품 정보 수정 검증
    @Test
    @DisplayName("제품 수정: 제품 이름을 변경했을 때 DB에 반영되는지 확인")
    void updateProductInfo() {
        // given
        Product product = new Product();
        product.setName("기존 이름");
        Product saved = productRepository.save(product);

        // when
        saved.setName("수정된 이름");
        productRepository.flush();

        // then
        Product updated = productRepository.findById(saved.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("수정된 이름");
    }

    // 4. [Delete] 제품 삭제 검증
    @Test
    @DisplayName("제품 삭제: 제품을 삭제하면 더 이상 DB에서 조회되지 않는지 확인")
    void deleteProduct() {
        // given
        Product product = new Product();
        product.setName("삭제될 제품");
        Product saved = productRepository.save(product);

        // when
        productRepository.delete(saved);

        // then
        boolean exists = productRepository.existsById(saved.getId());
        assertThat(exists).isFalse();
    }
}