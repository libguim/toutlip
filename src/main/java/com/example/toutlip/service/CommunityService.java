package com.example.toutlip.service;

import com.example.toutlip.domain.CommunityPost;
import com.example.toutlip.domain.PersonalColorType;
import com.example.toutlip.dto.CommunityDTO;
import com.example.toutlip.repository.CommunityPostRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional // 데이터 일관성을 위해 기본 트랜잭션 적용
public class CommunityService {
    private final CommunityPostRepository communityPostRepository;
    private final ModelMapper modelMapper;

    /**
     * 1. [Read] 인기순(조회수) 피드 조회
     */
    @Transactional(readOnly = true)
    public List<CommunityDTO.CommunityPostResponseDTO> findAllOrderByViewCount() {
        // 정렬된 레포지토리 메서드를 호출하여 상위 노출 데이터를 가져옵니다.
        return communityPostRepository.findAllByOrderByViewCountDesc().stream()
                .map(this::convertToResponseDTO) // 커스텀 매핑 메서드 사용
                .collect(Collectors.toList());
    }

    /**
     * 2. [Read] 퍼스널 컬러 타입별 피드 필터링
     */
    @Transactional(readOnly = true)
    public List<CommunityDTO.CommunityPostResponseDTO> findAllByPersonalColor(PersonalColorType type) {
        // 특정 톤(예: SPRING_WARM)에 맞는 게시글만 필터링하여 조회합니다.
        return communityPostRepository.findAllByLipLog_User_PersonalColorType(type).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * 3. [Update] 게시글 상세 조회 시 조회수 증가
     */
    public void incrementViewCount(Integer id) {
        CommunityPost post = communityPostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        // Dirty Checking을 통해 조회수를 1 증가시킵니다.
        post.setViewCount(post.getViewCount() + 1);
    }

    /**
     * 4. [Update] 좋아요 클릭 (추가 기능)
     */
    public void incrementLikeCount(Integer id) {
        CommunityPost post = communityPostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        post.setLikeCount(post.getLikeCount() + 1); //
    }

    /**
     * 5. [Delete] 게시글 삭제
     */
    public void delete(Integer id) {
        if (!communityPostRepository.existsById(id)) {
            throw new IllegalArgumentException("삭제할 게시글이 없습니다.");
        }
        communityPostRepository.deleteById(id); //
    }

    /**
     * --- 내부 헬퍼 메서드: 엔티티를 DTO로 변환 ---
     * ModelMapper가 처리하지 못하는 Enum 설명 등을 보완합니다.
     */
    private CommunityDTO.CommunityPostResponseDTO convertToResponseDTO(CommunityPost post) {
        CommunityDTO.CommunityPostResponseDTO dto = modelMapper.map(post, CommunityDTO.CommunityPostResponseDTO.class);

        // 작성자의 퍼스널 컬러 한글 설명(예: "봄 웜톤")을 수동으로 매핑합니다.
        if (post.getLipLog() != null && post.getLipLog().getUser() != null) {
            String description = post.getLipLog().getUser().getPersonalColorType().getDescription();
            dto.setAuthorPersonalColor(description);
        }

        return dto;
    }
}