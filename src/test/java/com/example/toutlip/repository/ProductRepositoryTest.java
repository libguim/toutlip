package com.example.toutlip.repository;

import com.example.toutlip.domain.Brand;
import com.example.toutlip.domain.Product;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class ProductRepositoryTest {
    @Autowired private ProductRepository productRepository;
    @Autowired private BrandRepository brandRepository;

    @Test
    @DisplayName("제품 CRUD: 브랜드 연관 제품의 생성부터 삭제까지 확인")
    void productFullCrud() {
        // 1. Create (Brand와 함께)
        Brand brand = new Brand();
        brand.setName("ToutLip_Brand");
        brandRepository.save(brand);

        Product product = new Product();
        product.setName("테스트 립스틱");
        product.setBrand(brand);
        Product saved = productRepository.save(product);

        // 2. Read (Brand ID 기반 필터링)
        List<Product> products = productRepository.findAllByBrandId(brand.getId());
        assertThat(products).anyMatch(p -> p.getName().equals("테스트 립스틱"));

        // 3. Update
        saved.setName("수정된 립스틱");
        productRepository.flush();
        assertThat(productRepository.findById(saved.getId()).get().getName()).isEqualTo("수정된 립스틱");

        // 4. Delete
        productRepository.delete(saved);
        assertThat(productRepository.existsById(saved.getId())).isFalse();
    }
}

