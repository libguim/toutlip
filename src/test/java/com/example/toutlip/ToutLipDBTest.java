package com.example.toutlip;

import com.example.toutlip.domain.Brand;
import com.example.toutlip.domain.Product;
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
@Transactional // 테스트 완료 후 데이터를 자동으로 롤백하여 DB 청결 유지
class ToutLipDBTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BrandRepository brandRepository;

    // 1. [Create] 데이터 생성 테스트
    @Test
    @DisplayName("Create: 브랜드와 제품이 실제 DB 환경에서 유기적으로 생성된다")
    void create() {
        // given
        Brand brand = new Brand();
        brand.setName("ToutLip Official");
        brandRepository.save(brand);

        Product product = new Product();
        product.setName("에어리 매트 틴트");
        product.setBrand(brand);

        // when
        Product saved = productRepository.save(product);

        // then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getBrand().getName()).isEqualTo("ToutLip Official");
    }

    // 2. [Read] 데이터 조회 테스트
    @Test
    @DisplayName("Read: 저장된 제품 리스트를 브랜드 ID로 정확히 읽어온다")
    void read() {
        // given
        Brand brand = new Brand();
        brand.setName("샤넬");
        brandRepository.save(brand);

        Product p1 = new Product();
        p1.setName("립스틱 A");
        p1.setBrand(brand);
        productRepository.save(p1);

        // when
        List<Product> products = productRepository.findAllByBrandId(brand.getId());

        // then
        assertThat(products).isNotEmpty();
        assertThat(products.get(0).getName()).contains("립스틱");
    }

    // 3. [Update] 데이터 수정 테스트
    @Test
    @DisplayName("Update: 엔티티의 상태 변경이 실제 DB 반영까지 성공한다")
    void update() {
        // given
        Product product = new Product();
        product.setName("변경 전 제품");
        Product saved = productRepository.save(product);

        // when
        saved.setName("변경 후 제품");
        productRepository.flush(); // 영속성 컨텍스트 내용을 DB에 즉시 반영

        // then
        Product updated = productRepository.findById(saved.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("변경 후 제품");
    }

    // 4. [Delete] 데이터 삭제 테스트
    @Test
    @DisplayName("Delete: 삭제 요청 시 DB에서 해당 레코드가 깔끔하게 제거된다")
    void delete() {
        // given
        Product product = new Product();
        product.setName("삭제 대상");
        Product saved = productRepository.save(product);

        // when
        productRepository.delete(saved);

        // then
        boolean exists = productRepository.existsById(saved.getId());
        assertThat(exists).isFalse();
    }
}