package com.example.toutlip;

import com.example.toutlip.domain.*;
import com.example.toutlip.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class ToutLipDBTest {

    @Autowired private UserRepository userRepository;
    @Autowired private BrandRepository brandRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ProductColorRepository productColorRepository;
    @Autowired private CommunityPostRepository communityPostRepository;
    @Autowired private LipLogRepository lipLogRepository;
    @Autowired private EntityManager em;

    // 1. [Create] 엔티티 저장 및 연관관계 검증
    @Test
//    @Rollback(false)
    @DisplayName("Create: User와 Brand를 생성하고 정상 저장한다")
    void create_Entities_Success() {
        // User 저장
        User user = new User();
        user.setUsername("moana");
        userRepository.save(user);

        // Brand 저장
        Brand brand = new Brand();
        brand.setName("ToutLip Official");
        brandRepository.save(brand);

        assertThat(user.getId()).isNotNull();
        assertThat(brand.getId()).isNotNull();
    }

    // 2. [Read] 기본 메서드를 이용한 데이터 조회
    @Test
//    @Rollback(false)
    @DisplayName("Read: 저장된 모든 제품 목록을 리스트로 읽어온다")
    void read_AllProducts_Success() {
        Product product = new Product();
        product.setName("에어리 매트 틴트");
        productRepository.save(product);
        productRepository.flush();

        List<Product> products = productRepository.findAll();
        assertThat(products).isNotEmpty();
    }

    // 3. [Update] Dirty Checking을 통한 데이터 수정
    @Test
    @Rollback(false)
    @DisplayName("Update: 엔티티 수정 후 DB 반영 여부를 확인한다")
    void update_ProductColor_Success() {
        ProductColor color = new ProductColor();
        color.setColorName("핑크");
        color.setHexCode("#FFC0CB");
        productColorRepository.save(color);
        productColorRepository.flush();

        // 수정 로직
        color.setColorName("코랄 핑크");
        color.setHexCode("#F88379");
        productColorRepository.save(color);
        productColorRepository.flush();
        em.clear();

        ProductColor updated = productColorRepository.findById(color.getId()).orElseThrow();
        assertThat(updated.getColorName()).isEqualTo("코랄 핑크");
    }

    // 4. [Delete] 데이터 삭제 및 존재 여부 확인
    @Test
    @DisplayName("Delete: CommunityPost 삭제 후 DB에 데이터가 없는지 확인한다")
    void delete_CommunityPost_Success() {
        CommunityPost post = new CommunityPost();
        communityPostRepository.save(post);
        communityPostRepository.flush();

        communityPostRepository.delete(post);
        communityPostRepository.flush();

        boolean exists = communityPostRepository.existsById(post.getId());
        assertThat(exists).isFalse();
    }

    // 5. [Complex] 연관관계와 활동 로그 기록 테스트
    @Test
    @DisplayName("Complex: LipLog 활동 기록이 정상 생성된다")
    void save_LipLog_Success() {
        LipLog log = new LipLog();
        log.setMemo("오늘의 테스트 기록");

        LipLog saved = lipLogRepository.save(log);
        assertThat(saved.getId()).isNotNull();
    }
}