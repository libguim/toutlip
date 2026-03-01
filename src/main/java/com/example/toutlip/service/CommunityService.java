package com.example.toutlip.service;

import com.example.toutlip.domain.CommunityPost;
import com.example.toutlip.domain.LipLog;
import com.example.toutlip.domain.PersonalColorType;
import com.example.toutlip.dto.CommunityDTO;
import com.example.toutlip.repository.CommunityPostRepository;
import com.example.toutlip.repository.LipLogRepository;
import jakarta.persistence.EntityNotFoundException;
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
    private final LipLogRepository lipLogRepository;

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
//    public void delete(Integer id) {
//        if (!communityPostRepository.existsById(id)) {
//            throw new IllegalArgumentException("삭제할 게시글이 없습니다.");
//        }
//        communityPostRepository.deleteById(id); //
//    }


//    @Transactional
//    public void delete(Integer id) {
//        // 1. 삭제할 게시글을 먼저 조회합니다.
//        CommunityPost post = communityPostRepository.findById(id)
//                .orElseThrow(() -> new IllegalArgumentException("삭제할 게시글이 없습니다."));
//
//        // 2. 📍 [핵심 핀셋] 연결된 사진(LipLog)들을 보관함용으로 되돌립니다.
//        if (post.getLipLogs() != null) {
//            post.getLipLogs().forEach(log -> {
//                log.setCommunityPost(null); // 피드와의 연결 고리 제거
//                log.setIsPublic(false);      // 다시 내 보관함 전용으로 변경
//            });
//
//            // 리스트를 비워 관계를 완전히 정리합니다.
//            post.getLipLogs().clear();
//        }
//
//        // 3. 이제 게시글만 안전하게 삭제합니다.
//        communityPostRepository.delete(post);
//    }

//    @Transactional
//    public void delete(Integer id) {
//        // 📍 1. 존재 여부를 먼저 확인하여 에러 발생 원천 차단
//        CommunityPost post = communityPostRepository.findById(id).orElse(null);
//        if (post == null) return; // 이미 없으면 조용히 종료
//
//        // 📍 2. 복제된 사진(LipLog) 처리
//        // 우리는 이미 사진을 '복제'해서 사용하므로,
//        // 원본을 되돌릴 필요 없이 이 게시글에 속한 '복사본'들만 같이 지워지게 두면 됩니다.
//        // (CascadeType.ALL 또는 REMOVE 설정이 되어 있다면 자동으로 지워짐)
//
//        communityPostRepository.delete(post);
//    }


// CommunityService.java 내 delete 메서드 보강
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

        communityPostRepository.delete(post);
        // flush를 통해 삭제 명령을 즉시 실행하여 유령 데이터 생성을 막습니다.
        communityPostRepository.flush();
    }



    // CommunityService.java 내 delete 메서드 핀셋 교정
// CommunityService.java 내 delete 메서드 최종 교정
//    @Transactional
//    public void delete(Integer id) {
//        // 1. 삭제할 게시글 조회
//        CommunityPost post = communityPostRepository.findById(id).orElse(null);
//        if (post == null) return;
//
//        // 📍 [핀셋 핵심] 게시글에 묶인 '복제본' 사진들을 관계 끊기가 아닌 '물리 삭제'로 변경
//        if (post.getLipLogs() != null && !post.getLipLogs().isEmpty()) {
//            // 복제된 사진들(가지)을 리스트에서 하나씩 꺼내 명시적으로 삭제 명령
//            // 이렇게 해야 lip_log 테이블에서도 해당 행이 완전히 사라집니다.
//            post.getLipLogs().forEach(log -> {
//                lipLogRepository.delete(log);
//            });
//            post.getLipLogs().clear();
//        }
//
//        // 📍 [필수] 자식(사진) 삭제 쿼리를 DB에 즉시 꽂아넣어 제약 조건을 해제함
//        lipLogRepository.flush();
//
//        // 2. 이제 장애물이 없으므로 껍데기(게시글)를 안전하게 삭제
//        communityPostRepository.delete(post);
//
//        // 최종 반영 확정
//        communityPostRepository.flush();
//    }

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

    // CommunityService.java에 추가

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