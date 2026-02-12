package com.example.toutlip.repository;

import com.example.toutlip.domain.CommunityPost;
import com.example.toutlip.domain.LipLog;
import com.example.toutlip.domain.ProductColor;
import com.example.toutlip.domain.User;
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
class CommunityPostRepositoryTest {
    @Autowired private CommunityPostRepository postRepository;
    @Autowired private LipLogRepository lipLogRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductColorRepository colorRepository;

    @Test
    @DisplayName("커뮤니티 CRUD: 조회수 정렬 및 로그 연동 삭제 확인")
    void communityFullCrud() {
        // 1. Given: 필수 연관 데이터 준비 (User, Color)
        User user = new User();
        user.setUsername("post_tester");
        userRepository.save(user);

        ProductColor color = new ProductColor();
        color.setColorName("테스트 핑크");
        colorRepository.save(color);

        // 2. Create: LipLog 생성 시 User와 Color 연결
        LipLog log = new LipLog();
        log.setUser(user);
        log.setProductColor(color); // 이 코드가 빠지면 color_id null 에러가 발생합니다!
        log.setMemo("공유용 로그");
        lipLogRepository.save(log);

        CommunityPost post = new CommunityPost();
        post.setLipLog(log);
        post.setViewCount(10);
        postRepository.save(post);

        // 3. Read (조회수 정렬)
        List<CommunityPost> popularPosts = postRepository.findAllByOrderByViewCountDesc();
        assertThat(popularPosts).isNotEmpty();

        // 4. Update (조회수 증가)
        post.setViewCount(post.getViewCount() + 1);
        postRepository.flush();
        assertThat(postRepository.findById(post.getId()).get().getViewCount()).isEqualTo(11);

        // 5. Delete (로그 연동 삭제 시나리오)
        postRepository.deleteByLipLog(log);
        assertThat(postRepository.existsById(post.getId())).isFalse();
    }
}