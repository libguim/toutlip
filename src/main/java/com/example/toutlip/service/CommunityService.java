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
        return communityPostRepository.findAllByLipLogs_User_PersonalColorType(type).stream()
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
     * 내부 헬퍼 메서드: 엔티티를 DTO로 변환
     */
    private CommunityDTO.CommunityPostResponseDTO convertToResponseDTO(CommunityPost post) {
        // 1. 기본 매핑 (필드명이 같은 viewCount, likeCount 등은 자동 매핑됨)
        CommunityDTO.CommunityPostResponseDTO dto = modelMapper.map(post, CommunityDTO.CommunityPostResponseDTO.class);

        // 2. 이름이 다른 postId는 명시적 세팅
        dto.setPostId(post.getId());

        // 3. 리스트에서 첫 번째 정보를 추출하여 DTO 필드에 맞게 세팅
        post.getLipLogs().stream().findFirst().ifPresent(log -> {
            if (log.getUser() != null) {
                dto.setNickname(log.getUser().getNickname());
                dto.setAuthorPersonalColor(log.getUser().getPersonalColorType().name());
            }

            dto.setPhotoUrl(log.getPhotoUrl());

            // 📍 [수정 포인트] LipLog에 직접 필드가 없다면 연관된 엔티티에서 가져오기
            // 아래 코드는 예시입니다. 모아나의 Product 엔티티 구조에 맞춰주세요!
            if (log.getProductColor() != null) {
                dto.setBrandName(log.getProductColor().getProduct().getBrand().getName());
                dto.setProductName(log.getProductColor().getProduct().getName());
                dto.setColorName(log.getProductColor().getColorName());
            }
        });

        return dto;
    }


}