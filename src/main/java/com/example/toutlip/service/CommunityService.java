package com.example.toutlip.service;

import com.example.toutlip.domain.*;
import com.example.toutlip.dto.CommunityDTO;
import com.example.toutlip.dto.LipLogDTO;
import com.example.toutlip.dto.LipLogDTO.LipLogResponseDTO;
import com.example.toutlip.repository.CommunityPostRepository;
import com.example.toutlip.repository.LipLogRepository;
import com.example.toutlip.repository.PostLikeRepository;
import com.example.toutlip.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional // 데이터 일관성을 위해 기본 트랜잭션 적용
public class CommunityService {
    private final CommunityPostRepository communityPostRepository;
    private final ModelMapper modelMapper;
    private final LipLogRepository lipLogRepository;
    private final UserRepository userRepository;         // 유저 정보를 찾기 위해 필요
    private final PostLikeRepository postLikeRepository; // 좋아요 기록을 저장하기 위해 필요

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


    public void toggleLike(Integer postId, Integer userId) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글 없음"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("유저 없음"));

        // 📍 [핀셋 핵심] 이미 해당 유저가 좋아요를 눌렀는지 확인
//        Optional<PostLike> existingLike = postLikeRepository.findByUserAndCommunityPost(user, post);
        Optional<PostLike> existingLike = postLikeRepository.findByUserIdAndCommunityPostId(userId, postId);

        if (existingLike.isPresent()) {
            // 이미 있다면 삭제 (좋아요 취소)
            postLikeRepository.delete(existingLike.get());
            int currentCount = (post.getLikeCount() == null) ? 0 : post.getLikeCount();
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
        } else {
//            // 없다면 새로 생성 (좋아요 추가)
//            PostLike newLike = new PostLike();
//            newLike.setUser(user);
//            newLike.setCommunityPost(post);
//            postLikeRepository.save(newLike);
//            post.setLikeCount(post.getLikeCount() + 1);
            // 📍 [핀셋 수정] 'new PostLike()' 대신 @Builder를 사용하여 protected 에러 해결
            PostLike newLike = PostLike.builder()
                    .user(user)
                    .communityPost(post)
                    .build();

            postLikeRepository.save(newLike);

            // null 방어 로직 추가: 기본값 0에서 증가
            int currentCount = (post.getLikeCount() == null) ? 0 : post.getLikeCount();
            post.setLikeCount(currentCount + 1);
        }
    }

    @Transactional
    public void delete(Integer id) {
        CommunityPost post = communityPostRepository.findById(id).orElse(null);
        if (post == null) return;

        // 📍 [핀셋] 게시글이 삭제될 때 연결된 모든 사진을 '보관함 전용(false)'으로 안전하게 돌려보냅니다.
        if (post.getLipLogs() != null) {
            post.getLipLogs().forEach(log -> {
                log.setCommunityPost(null);
                log.setIsPublic(false);
            });
            post.getLipLogs().clear();
        }

        if (post.getPostLikes() != null) {
            post.getPostLikes().clear();
        }

        communityPostRepository.delete(post);
        // flush를 통해 삭제 명령을 즉시 실행하여 유령 데이터 생성을 막습니다.
        communityPostRepository.flush();
    }

    /**
     * 내부 헬퍼 메서드: 엔티티를 DTO로 변환
     */
    private CommunityDTO.CommunityPostResponseDTO convertToResponseDTO(CommunityPost post) {

        System.out.println("=== 🔍 디버깅: 게시글 데이터 확인 ===");
        System.out.println("게시글 ID: " + post.getId() + " 의 사진(lipLogs) 개수: " + (post.getLipLogs() != null ? post.getLipLogs().size() : 0));

        // 1. 기본 매핑 (필드명이 같은 viewCount, likeCount 등은 자동 매핑됨)
        CommunityDTO.CommunityPostResponseDTO dto = modelMapper.map(post, CommunityDTO.CommunityPostResponseDTO.class);

        // 2. 이름이 다른 postId는 명시적 세팅
        dto.setPostId(post.getId());

        if (post.getLipLogs() != null && !post.getLipLogs().isEmpty()) {
            LipLog firstLog = post.getLipLogs().get(0);
            if (firstLog.getUser() != null) {
                dto.setNickname(firstLog.getUser().getNickname());
                // 필요한 경우 프로필 이미지 등 추가 세팅
            }

            dto.setLipLogs(post.getLipLogs().stream().map(log -> {
                LipLogDTO.LipLogResponseDTO logDto = new LipLogDTO.LipLogResponseDTO();
                logDto.setLogId(log.getId());
                logDto.setPhotoUrl(log.getPhotoUrl());

                // 📍 [핀셋 수정] Base 컬러 정보 추출
                if (log.getBaseColor() != null) {
                    logDto.setBaseHex(log.getBaseColor().getHexCode());
                    logDto.setBaseBrand(log.getBaseColor().getProduct().getBrand().getName());
                    logDto.setBaseColorName(log.getBaseColor().getColorName());
                }

                // 📍 [핀셋 수정] Point 컬러 정보 추출
                if (log.getPointColor() != null) {
                    logDto.setPointHex(log.getPointColor().getHexCode());
                    logDto.setPointBrand(log.getPointColor().getProduct().getBrand().getName());
                    logDto.setPointColorName(log.getPointColor().getColorName());
                }
                return logDto;
            }).collect(Collectors.toList()));
        }

        return dto;
    }

    /**
     * [최종 빌드업] 게시글 수정: 모아나의 대원칙 반영
     * 1. 수정 시 제외된 사진은 원본 상태(isPublic=false)로 복구하여 보관함 보존
     * 2. 물리적 삭제가 아닌 '관계 재설정'으로 이미지 액박(경로 유실) 방지
     */
    @Transactional
    public void update(Integer postId, CommunityDTO.CommunityPostRequestDTO dto) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("수정할 게시글을 찾을 수 없습니다."));

        // 1. 메모 수정
        post.setMemo(dto.getMemo());

        // 2. [대원칙 핵심] 기존 연결된 사진들의 '상태 복구' 및 '연결 해제'
        if (post.getLipLogs() != null && !post.getLipLogs().isEmpty()) {
            post.getLipLogs().forEach(log -> {
                // 📍 가지만 쳐내고 뿌리(원본)는 보관함 전용(false)으로 되돌립니다.
                log.setIsPublic(false);
                log.setCommunityPost(null);
            });
            // 리스트를 비워 JPA가 관계가 끊어졌음을 인지하게 합니다.
            post.getLipLogs().clear();
        }

        // 연결 해제 정보를 DB에 즉시 반영 (유령 데이터 방지)
        lipLogRepository.flush();

        // 3. [대원칙 핵심] 새롭게 선택된 사진들을 게시글에 '연결'
        List<LipLog> newSelectedLogs = lipLogRepository.findAllById(dto.getLogIds());
        for (LipLog log : newSelectedLogs) {
            log.setIsPublic(true);           // 공개 상태로 전환
            log.setCommunityPost(post);      // 게시글과 연결
            post.getLipLogs().add(log);      // 게시글 리스트에 추가
        }

        // 최종 상태 저장
        communityPostRepository.save(post);
    }




}