package com.example.toutlip.repository;

import com.example.toutlip.domain.Product;
import com.example.toutlip.domain.ProductColor;
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
class ProductColorRepositoryTest {
    @Autowired
    private ProductColorRepository colorRepository;
    @Autowired
    private ProductRepository productRepository;

    @Test
    @DisplayName("컬러 CRUD: 제품별 컬러 정보의 관리 상태 확인")
    void colorFullCrud() {
        // 1. Create
        Product product = new Product();
        product.setName("베이스 제품");
        productRepository.save(product);

        ProductColor color = new ProductColor();
        color.setColorName("레드");
        color.setHexCode("#FF0000");
        color.setProduct(product);
        ProductColor saved = colorRepository.save(color);

        // 2. Read
        List<ProductColor> colors = colorRepository.findAllByProductId(product.getId());
        assertThat(colors).isNotEmpty();

        // 3. Update
        saved.setHexCode("#CC0000");
        colorRepository.flush();
        assertThat(colorRepository.findById(saved.getId()).get().getHexCode()).isEqualTo("#CC0000");

        // 4. Delete
        colorRepository.delete(saved);
        assertThat(colorRepository.existsById(saved.getId())).isFalse();
    }
}
