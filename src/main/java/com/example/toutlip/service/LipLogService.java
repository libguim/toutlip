package com.example.toutlip.service;

import com.example.toutlip.domain.CommunityPost;
import com.example.toutlip.domain.LipLog;
import com.example.toutlip.domain.ProductColor;
import com.example.toutlip.domain.User;
import com.example.toutlip.dto.LipLogDTO;
import com.example.toutlip.repository.CommunityPostRepository;
import com.example.toutlip.repository.LipLogRepository;
import com.example.toutlip.repository.ProductColorRepository;
import com.example.toutlip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class LipLogService {
    private final LipLogRepository lipLogRepository;
    private final CommunityPostRepository communityPostRepository;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;
    private final ProductColorRepository colorRepository;

    // [Create] 기록 생성 및 공유
    public LipLogDTO.LipLogResponseDTO createLipLog(LipLogDTO.LipLogRequestDTO dto) {
        // 1. 사용자 및 컬러 정보 조회 (레포지토리의 기본 findById 사용)
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        ProductColor color = colorRepository.findById(dto.getColorId())
                .orElseThrow(() -> new IllegalArgumentException("컬러 정보를 찾을 수 없습니다."));

        // 2. 엔티티 매핑
        LipLog entity = modelMapper.map(dto, LipLog.class);
        entity.setUser(user);
        entity.setProductColor(color);

        LipLog saved = lipLogRepository.save(entity);

        // 3. 커뮤니티 공유 로직
        if (Boolean.TRUE.equals(saved.getIsPublic())) {
            publishToCommunity(saved);
        }
        return modelMapper.map(saved, LipLogDTO.LipLogResponseDTO.class);
    }

    // [Read] 내 기록 최신순 조회
    @Transactional(readOnly = true)
    public List<LipLogDTO.LipLogResponseDTO> readMyLogs(Integer userId) {
        return lipLogRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(log -> modelMapper.map(log, LipLogDTO.LipLogResponseDTO.class))
                .collect(Collectors.toList());
    }

    // [Update] 기록 수정 및 공유 상태 동기화
    public LipLogDTO.LipLogResponseDTO updateLipLog(Integer id, LipLogDTO.LipLogRequestDTO dto) {
        LipLog log = lipLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("기록을 찾을 수 없습니다."));

        log.setMemo(dto.getMemo());
        syncCommunityPost(log, dto.getIsPublic()); // 공유 상태 변경에 따른 게시글 관리
        log.setIsPublic(dto.getIsPublic());

        return modelMapper.map(log, LipLogDTO.LipLogResponseDTO.class);
    }

    // [Delete] 기록 및 관련 포스트 삭제
    public void deleteLipLog(Integer id) {
        LipLog log = lipLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("기록을 찾을 수 없습니다."));

        communityPostRepository.deleteByLipLog(log); // 변경된 함수명 반영
        lipLogRepository.delete(log);
    }

    // --- Helper Methods ---
    private void publishToCommunity(LipLog log) {
        CommunityPost post = new CommunityPost();
        post.setLipLog(log);
        post.setViewCount(0); // 초기값 설정
        post.setLikeCount(0); // 초기값 설정
        communityPostRepository.save(post);
    }

    private void syncCommunityPost(LipLog log, Boolean nextStatus) {
        if (!log.getIsPublic() && nextStatus) publishToCommunity(log);
        else if (log.getIsPublic() && !nextStatus) communityPostRepository.deleteByLipLog(log);
    }
}