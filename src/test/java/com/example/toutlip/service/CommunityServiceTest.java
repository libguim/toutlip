package com.example.toutlip.service;

import com.example.toutlip.domain.CommunityPost;
import com.example.toutlip.domain.LipLog;
import com.example.toutlip.domain.ProductColor;
import com.example.toutlip.domain.User;
import com.example.toutlip.dto.CommunityDTO;
import com.example.toutlip.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class CommunityServiceTest {
    @Autowired private CommunityService communityService;
    @Autowired private CommunityPostRepository communityPostRepository;
    @Autowired private LipLogRepository lipLogRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductColorRepository colorRepository;

    @Test
    @DisplayName("[Community] 커뮤니티 CRUD: 조회수 증가 및 인기순 피드 확인")
    void communityInteractionCrud() {
        // 1. 준비: User 및 ProductColor 먼저 생성 (필수 외래키)
        User user = new User();
        user.setUsername("community_user");
        userRepository.save(user);

        ProductColor color = new ProductColor();
        color.setColorName("테스트 레드");
        colorRepository.save(color); // 반드시 저장 먼저!

        // 2. LipLog 생성 시 필수 정보 연결
        LipLog log = new LipLog();
        log.setUser(user);
        log.setProductColor(color); // 이 부분이 누락되어 'color_id' null 에러가 났던 거예요!
        log.setMemo("공유용 로그");
        lipLogRepository.save(log);

        // 3. CommunityPost 생성
        CommunityPost post = new CommunityPost();
        post.setLipLog(log);
        post.setViewCount(0);
        communityPostRepository.save(post);

        // 4. Update 및 Read 검증 (기존 로직)
        communityService.incrementViewCount(post.getId());

        List<CommunityDTO.CommunityPostResponseDTO> feed = communityService.findAllOrderByViewCount();
        assertThat(feed.get(0).getViewCount()).isEqualTo(1);
    }
}