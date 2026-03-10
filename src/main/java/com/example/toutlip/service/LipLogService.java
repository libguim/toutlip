package com.example.toutlip.service;

import com.example.toutlip.domain.CommunityPost;
import com.example.toutlip.domain.LipLog;
import com.example.toutlip.domain.ProductColor;
import com.example.toutlip.domain.User;
import com.example.toutlip.dto.CommunityDTO;
import com.example.toutlip.dto.LipLogDTO;
import com.example.toutlip.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class LipLogService {
    private final LipLogRepository lipLogRepository;
    private final CommunityPostRepository communityPostRepository;
    private final CommunityService communityService;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;
    private final ProductColorRepository colorRepository;
    private final PostLikeRepository postLikeRepository;

    @Transactional(readOnly = true)
    public List<CommunityDTO.CommunityPostResponseDTO> readPublicLogs(Integer userId) {
        return communityPostRepository.findAll().stream()
                // 1. 최신순 정렬
                .sorted(Comparator.comparing(CommunityPost::getId).reversed())
                .map(post -> {
                    CommunityDTO.CommunityPostResponseDTO dto = new CommunityDTO.CommunityPostResponseDTO();
                    dto.setPostId(post.getId());
                    dto.setMemo(post.getMemo());
                    dto.setBrandName(post.getBrandName());
                    dto.setProductName(post.getProductName());
                    dto.setCreatedAt(post.getCreatedAt() != null ? post.getCreatedAt().toString() : "");

                    // DB에 저장된 실제 좋아요 수 반영
                    long actualLikeCount = postLikeRepository.countByCommunityPostId(post.getId());
                    dto.setLikeCount((int) actualLikeCount);

                    // 현재 로그인한 유저가 이 게시글에 좋아요를 눌렀는지 판별
                    if (userId != null) {
                        // PostLikeRepository를 사용하여 존재 여부 확인
                        boolean isLiked = postLikeRepository.findByUserIdAndCommunityPostId(userId, post.getId()).isPresent();
                        dto.setLiked(isLiked); // 프론트의 'liked' 필드와 매핑됨
                    } else {
                        dto.setLiked(false);
                    }

                    if (post.getLipLogs() != null && !post.getLipLogs().isEmpty()) {

                        dto.setLipLogs(post.getLipLogs().stream().map(log -> {
                            LipLogDTO.LipLogResponseDTO logDto = modelMapper.map(log, LipLogDTO.LipLogResponseDTO.class);
                            logDto.setPhotoUrl(log.getPhotoUrl());

                            // Base 컬러 정보 매핑
                            if (log.getBaseColor() != null) {
                                logDto.setBaseHex(log.getBaseColor().getHexCode());
                                logDto.setBaseBrand(log.getBaseColor().getProduct().getBrand().getName());
                                logDto.setBaseColorName(log.getBaseColor().getColorName());
                            }

                            // Point 컬러 정보 매핑
                            if (log.getPointColor() != null) {
                                logDto.setPointHex(log.getPointColor().getHexCode());
                                logDto.setPointBrand(log.getPointColor().getProduct().getBrand().getName());
                                logDto.setPointColorName(log.getPointColor().getColorName());
                            }
                            return logDto;
                        }).collect(Collectors.toList()));


                        // 3. 대표 데이터 설정 (첫 번째 사진 기준)
                        // 여기서도 default-lip.png가 아닌 실제 추출된 photoUrl을 사용합니다.
                        if (!dto.getLipLogs().isEmpty()) {
                            dto.setPhotoUrl(dto.getLipLogs().get(0).getPhotoUrl());
                            dto.setBrandName(dto.getLipLogs().get(0).getBrandName());
                            dto.setProductName(dto.getLipLogs().get(0).getProductName());
                            dto.setImages(dto.getLipLogs());
                        }

                        // 작성자 정보 설정
                        if (post.getLipLogs().get(0).getUser() != null) {
                            dto.setNickname(post.getLipLogs().get(0).getUser().getNickname());
                            String profileImg = post.getLipLogs().get(0).getUser().getProfileImg();
                            dto.setUserProfileImg((profileImg == null || profileImg.isEmpty())
                                    ? "default-avatar.png" : profileImg);
                        }

                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }


    @Transactional
    public void updateCommunityPost(Integer postId, CommunityDTO.CommunityPostRequestDTO dto) {
        // 1. 수정할 게시글 조회
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        post.setMemo(dto.getMemo());

        // 기존에 연결된 사진들을 지우지 않고, '연결 고리'만 끊어 보관함으로 돌려보냅니다.
        if (post.getLipLogs() != null) {
            post.getLipLogs().forEach(log -> {
                log.setCommunityPost(null); // 📍 게시글과의 관계 해제
                log.setIsPublic(false);      // 📍 다시 보관함용(비공개)으로 상태 변경
            });
            post.getLipLogs().clear(); // 리스트 비우기
        }

        // 관계 해제를 DB에 즉시 알려 유령 데이터 생성을 방지합니다.
        lipLogRepository.flush();

        // 사진을 새로 생성(Builder)하지 않고, 보관함에 있는 '그 사진'을 그대로 가져와 연결합니다.
        List<LipLog> selectedLogs = lipLogRepository.findAllById(dto.getLogIds());
        for (LipLog log : selectedLogs) {
            log.setCommunityPost(post); // 📍 이 게시글의 주인이 됨
            log.setIsPublic(true);      // 📍 게시글에 등록되었으므로 공개 상태
            post.getLipLogs().add(log);
        }

        // 최종 상태 저장 (새로운 행 생성 없이 기존 행의 필드만 업데이트됨)
        communityPostRepository.save(post);
    }

    // 로그 수정 (image_a9207e 해결)
    public LipLogDTO.LipLogResponseDTO updateLipLog(Integer id, LipLogDTO.LipLogRequestDTO dto) {
        LipLog lipLog = lipLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("로그를 찾을 수 없습니다."));

        if (dto.getIsPublic() != null) lipLog.setIsPublic(dto.getIsPublic());
        if (dto.getMemo() != null) lipLog.setMemo(dto.getMemo());

        return modelMapper.map(lipLog, LipLogDTO.LipLogResponseDTO.class);
    }

    // [Create] 기록 생성 (보관함 저장 전용)
    public LipLogDTO.LipLogResponseDTO createLipLog(LipLogDTO.LipLogRequestDTO dto) {

        System.out.println("🛠️ [DEBUG] userId: " + dto.getUserId());
        System.out.println("🛠️ [DEBUG] baseColorId: " + dto.getBaseColorId());

        if (dto.getUserId() == null || dto.getBaseColorId() == null) {
            throw new IllegalArgumentException("필수 ID(userId 또는 baseColorId)가 누락되었습니다.");
        }

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // DTO에서 두 가지 ID를 꺼내 각각 조회합니다.
        ProductColor baseColor = colorRepository.findById(dto.getBaseColorId())
                .orElseThrow(() -> new IllegalArgumentException("베이스 컬러 정보를 찾을 수 없습니다."));

        // 포인트 컬러는 선택 사항(null 가능)으로 처리합니다.
        ProductColor pointColor = null;
        if (dto.getPointColorId() != null) {
            pointColor = colorRepository.findById(dto.getPointColorId()).orElse(null);
        }


        LipLog entity = LipLog.builder()
                .user(user)
                .baseColor(baseColor)   // 👈 엔티티의 baseColor 필드
                .pointColor(pointColor) // 👈 엔티티의 pointColor 필드
//                .productColor(color)
                .photoUrl(dto.getPhotoUrl())
                .memo(dto.getMemo())
                .isPublic(false) // 보관함 전용이므로 기본 false
                .build();

        LipLog saved = lipLogRepository.save(entity);
        return convertToResponseDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<LipLogDTO.LipLogResponseDTO> readMyLogs(Integer userId) {
        // 내 ID로 등록된 모든 로그를 가져옵니다.
        return lipLogRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(log -> {
                    // 1. 기본 DTO 변환 (기존 convertToResponseDTO 활용)
                    LipLogDTO.LipLogResponseDTO dto = convertToResponseDTO(log);

                    // 이 사진이 게시글(CommunityPost)에 연결되어 있다면,
                    // 게시글 엔티티의 컬럼값이 아닌 PostLike 테이블의 행 개수를 직접 셉니다.
                    if (log.getCommunityPost() != null) {
                        long actualLikeCount = postLikeRepository.countByCommunityPostId(log.getCommunityPost().getId());
                        dto.setLikeCount((int) actualLikeCount);
                    } else {
                        dto.setLikeCount(0); // 게시글이 없으면 좋아요는 0개
                    }

                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void createMultiPhotoPost(CommunityDTO.CommunityPostRequestDTO dto) { // 📍 매개변수를 DTO로 변경
        // 기존 내부 로직에서 사용하는 값들을 dto에서 꺼내줍니다.
        List<Integer> logIds = dto.getLogIds();
        String memo = dto.getMemo();

        CommunityPost post = CommunityPost.builder().memo(memo).build();
        CommunityPost savedPost = communityPostRepository.save(post);

        List<LipLog> selectedLogs = lipLogRepository.findAllById(logIds);
        for (LipLog log : selectedLogs) {
            log.setIsPublic(true);
            log.setCommunityPost(savedPost);
        }
    }

    @Transactional
    public void deleteLipLog(Integer logId) {
        // 사진이 없으면 이미 지워진 것이므로 에러를 던지지 않고 조용히 종료합니다.
        LipLog target = lipLogRepository.findById(logId).orElse(null);

        if (target == null) {
            System.out.println("🍃 [DEBUG] 이미 삭제된 사진입니다. (logId: " + logId + ")");
            return;
        }

        if (target.getCommunityPost() != null) {
            Integer postId = target.getCommunityPost().getId();
            CommunityPost postToDelete = target.getCommunityPost();

            try {
                target.setCommunityPost(null);
                lipLogRepository.saveAndFlush(target);

                // 게시글이 존재할 때만 삭제 시도
                if (communityPostRepository.existsById(postId)) {
                    communityPostRepository.delete(postToDelete);
                    communityPostRepository.flush();
                }
            } catch (Exception e) {
                // 삭제 중 발생하는 충돌은 일괄 삭제 특성상 발생할 수 있으므로 로그만 남김
                System.out.println("ℹ️ [DEBUG] 게시글 처리 중 경미한 충돌 (무시): " + e.getMessage());
            }
        }

        lipLogRepository.delete(target);
        lipLogRepository.flush();
    }

    private LipLogDTO.LipLogResponseDTO convertToResponseDTO(LipLog log) {
        // 기존의 꼼꼼한 매핑 로직 유지
        LipLogDTO.LipLogResponseDTO dto = new LipLogDTO.LipLogResponseDTO();
        dto.setLogId(log.getId());
        dto.setPhotoUrl(log.getPhotoUrl());
        dto.setMemo(log.getMemo());
        dto.setIsPublic(log.getIsPublic());
        dto.setCreatedAt(log.getCreatedAt());

        if (log.getBaseColor() != null) {
            dto.setBaseHex(log.getBaseColor().getHexCode());
            dto.setBaseColorName(log.getBaseColor().getColorName());
            if (log.getBaseColor().getProduct() != null) {
                dto.setBaseProductName(log.getBaseColor().getProduct().getName());
                dto.setBaseBrand(log.getBaseColor().getProduct().getBrand().getName());
            }
        }

        // 📍 [핀셋 수정] 2. Point 컬러 정보 매핑
        if (log.getPointColor() != null) {
            dto.setPointHex(log.getPointColor().getHexCode());
            dto.setPointColorName(log.getPointColor().getColorName());
            if (log.getPointColor().getProduct() != null) {
                dto.setPointProductName(log.getPointColor().getProduct().getName());
                dto.setPointBrand(log.getPointColor().getProduct().getBrand().getName());
            }
        }

        if (log.getUser() != null) {
            dto.setNickname(log.getUser().getNickname());
        }
        return dto;
    }

    @Transactional
    public void deleteCommunityPost(Integer postId) { // Long 대신 Integer 사용
        communityPostRepository.deleteById(postId);
    }

    @Transactional(readOnly = true)
    public CommunityDTO.CommunityPostResponseDTO readPostDetail(Integer postId) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글 없음"));

        CommunityDTO.CommunityPostResponseDTO dto = new CommunityDTO.CommunityPostResponseDTO();
        dto.setPostId(post.getId());
        dto.setMemo(post.getMemo());

        // post.getLipLogs()가 비어있지 않을 때만 안전하게 실행
        if (post.getLipLogs() != null && !post.getLipLogs().isEmpty()) {
            List<LipLogDTO.LipLogResponseDTO> logDtos = post.getLipLogs().stream().map(log -> {
                LipLogDTO.LipLogResponseDTO logDto = modelMapper.map(log, LipLogDTO.LipLogResponseDTO.class);

                logDto.setLogId(log.getId());
                logDto.setPhotoUrl(log.getPhotoUrl());

                // 원본 ID 찾아 매핑 (기존 로직 유지)
                lipLogRepository.findByPhotoUrl(log.getPhotoUrl()).stream()
                        .filter(orig -> !orig.getIsPublic())
                        .findFirst()
                        .ifPresent(orig -> logDto.setOriginalLogId(orig.getId()));

                return logDto;
            }).collect(Collectors.toList());

            // 변수가 선언된 if문 블록 안에서 안전하게 세팅하여 에러 방지
            dto.setLipLogs(logDtos);
            dto.setImages(logDtos);

            // 대표 이미지 설정
            dto.setPhotoUrl(logDtos.get(0).getPhotoUrl());
        }
        return dto;
    }


}