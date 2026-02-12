package com.example.toutlip.service;

import com.example.toutlip.domain.ProductColor;
import com.example.toutlip.domain.User;
import com.example.toutlip.dto.LipLogDTO;
import com.example.toutlip.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class LipLogServiceTest {
    @Autowired private LipLogService lipLogService;
    @Autowired private LipLogRepository lipLogRepository;
    @Autowired private CommunityPostRepository communityPostRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductColorRepository colorRepository;

    @Test
    @DisplayName("[LipLog] 기록 CRUD: 생성/수정/삭제 시 커뮤니티 게시글과의 동기화 확인")
    void lipLogFullCrud() {
        // 준비: 유저 및 컬러 생성
        User user = new User(); user.setUsername("moana"); userRepository.save(user);
        ProductColor color = new ProductColor(); color.setColorName("레드"); colorRepository.save(color);

        // 1. Create: 기록 생성 및 커뮤니티 자동 게시 확인
        LipLogDTO.LipLogRequestDTO req = LipLogDTO.LipLogRequestDTO.builder()
                .userId(user.getId())
                .colorId(color.getId())
                .memo("체험 메모")
                .isPublic(true)
                .build(); // photoUrl은 생략하면 null 혹은 기본값이 들어갑니다.
        LipLogDTO.LipLogResponseDTO saved = lipLogService.createLipLog(req);

        assertThat(communityPostRepository.findAll()).hasSize(1);

        // 2. Update: 비공개로 수정 시 커뮤니티 게시글 삭제 확인
        req.setIsPublic(false);
        lipLogService.updateLipLog(saved.getLogId(), req);

        assertThat(communityPostRepository.findAll()).isEmpty();

        // 3. Delete: 로그 삭제 시 완전 제거 확인
        lipLogService.deleteLipLog(saved.getLogId());
        assertThat(lipLogRepository.findById(saved.getLogId())).isEmpty();
    }
}