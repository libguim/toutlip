package com.example.toutlip.service;

import com.example.toutlip.domain.CommunityPost;
import com.example.toutlip.domain.LipLog;
import com.example.toutlip.domain.ProductColor;
import com.example.toutlip.domain.User;
import com.example.toutlip.dto.CommunityDTO;
import com.example.toutlip.dto.LipLogDTO;
import com.example.toutlip.repository.CommunityPostRepository;
import com.example.toutlip.repository.LipLogRepository;
import com.example.toutlip.repository.ProductColorRepository;
import com.example.toutlip.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;
    private final ProductColorRepository colorRepository;

    @Transactional(readOnly = true)
    public List<CommunityDTO.CommunityPostResponseDTO> readPublicLogs() {
        return communityPostRepository.findAll().stream()
                // 최신 글이 위로 오도록 역순 정렬
                .sorted(Comparator.comparing(CommunityPost::getId).reversed())
                .map(post -> {
                    CommunityDTO.CommunityPostResponseDTO dto = new CommunityDTO.CommunityPostResponseDTO();
                    dto.setPostId(post.getId());
                    dto.setMemo(post.getMemo());
                    // CommunityPost 엔티티에 직접 저장된 브랜드/제품명 우선 세팅
                    dto.setBrandName(post.getBrandName());
                    dto.setProductName(post.getProductName());
                    dto.setCreatedAt(post.getCreatedAt() != null ? post.getCreatedAt().toString() : "");

                    if (post.getLipLogs() != null && !post.getLipLogs().isEmpty()) {
                        // 📍 [핀셋 수정] 각 LipLog의 상세 정보(HexCode 포함)를 수동으로 매핑
                        dto.setLipLogs(post.getLipLogs().stream()
                                .map(log -> {
                                    LipLogDTO.LipLogResponseDTO logDto = modelMapper.map(log, LipLogDTO.LipLogResponseDTO.class);

                                    // 연관된 제품 컬러 정보가 있다면 상세 정보(HexCode 등)를 강제로 주입
                                    if (log.getProductColor() != null) {
                                        logDto.setHexCode(log.getProductColor().getHexCode());
                                        logDto.setColorName(log.getProductColor().getColorName());

                                        if (log.getProductColor().getProduct() != null) {
                                            logDto.setProductName(log.getProductColor().getProduct().getName());
                                            logDto.setBrandName(log.getProductColor().getProduct().getBrand().getName());
                                        }
                                    }
                                    return logDto;
                                })
                                .collect(Collectors.toList()));

                        // 첫 번째 사진 정보를 대표 데이터로 설정
                        dto.setPhotoUrl(post.getLipLogs().get(0).getPhotoUrl());
                        dto.setNickname(post.getLipLogs().get(0).getUser().getNickname());

                        String profileImg = post.getLipLogs().get(0).getUser().getProfileImg();
                        dto.setUserProfileImg((profileImg == null || profileImg.isEmpty()) ? "default-avatar.png" : profileImg);

                        // 3. 상위 DTO 제품 정보 보정 (기존 코드 유지)
                        if (!dto.getLipLogs().isEmpty()) {
                            dto.setBrandName(dto.getLipLogs().get(0).getBrandName());
                            dto.setProductName(dto.getLipLogs().get(0).getProductName());
                        }
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

//    @Transactional(readOnly = true)
//    public List<CommunityDTO.CommunityPostResponseDTO> readPublicLogs() {
//        // 📍 1. 정렬되지 않은 전체 데이터를 가져와서
//        return communityPostRepository.findAll().stream()
//                // 📍 2. ID(또는 생성시간) 기준 역순 정렬 추가 (최신 글이 위로!)
//                .sorted(Comparator.comparing(CommunityPost::getId).reversed())
//                .map(post -> {
//                    CommunityDTO.CommunityPostResponseDTO dto = new CommunityDTO.CommunityPostResponseDTO();
//
//                    dto.setPostId(post.getId());
//                    dto.setMemo(post.getMemo());
//                    dto.setBrandName(post.getBrandName());
//                    dto.setProductName(post.getProductName());
//                    dto.setCreatedAt(post.getCreatedAt() != null ? post.getCreatedAt().toString() : "");
//
//                    if (post.getLipLogs() != null && !post.getLipLogs().isEmpty()) {
//                        dto.setLipLogs(post.getLipLogs().stream()
//                                .map(log -> modelMapper.map(log, LipLogDTO.LipLogResponseDTO.class))
//                                .collect(Collectors.toList()));
//
//                        dto.setPhotoUrl(post.getLipLogs().get(0).getPhotoUrl());
//                        dto.setNickname(post.getLipLogs().get(0).getUser().getNickname());
//                    }
//                    return dto;
//                })
//                .collect(Collectors.toList());
//    }

    @Transactional
    public void updateCommunityPost(Integer postId, CommunityDTO.CommunityPostRequestDTO dto) {
        // 1. 기존 게시글 찾기
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        // 2. 글(Memo) 수정
        post.setMemo(dto.getMemo());

        // 3. 이미지(LipLog) 관계 재설정
        // 기존 연결된 로그들의 관계를 끊어줍니다.
        post.getLipLogs().forEach(log -> {
            log.setCommunityPost(null);
            log.setIsPublic(false);
        });
        post.getLipLogs().clear();

        // 새로운 로그들을 연결합니다.
        List<LipLog> newLogs = lipLogRepository.findAllById(dto.getLogIds());
        newLogs.forEach(log -> {
            log.setCommunityPost(post);
            log.setIsPublic(true);
        });

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
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        ProductColor color = colorRepository.findById(dto.getColorId())
                .orElseThrow(() -> new IllegalArgumentException("컬러 정보를 찾을 수 없습니다."));

        LipLog entity = LipLog.builder()
                .user(user)
                .productColor(color)
                .photoUrl(dto.getPhotoUrl())
                .memo(dto.getMemo())
                .isPublic(false) // 보관함 전용이므로 기본 false
                .build();

        LipLog saved = lipLogRepository.save(entity);
        return convertToResponseDTO(saved);
    }

    // [Read] 내 보관함 최신순 조회 (기존 로직 유지)
    @Transactional(readOnly = true)
    public List<LipLogDTO.LipLogResponseDTO> readMyLogs(Integer userId) {
        List<LipLog> logs = lipLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return logs.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    // [Create] 립로그 탭: 여러 장의 사진(최대 3장)을 선택하여 피드 공유
    @Transactional
    public void createMultiPhotoPost(List<Integer> logIds, String memo) {
        List<LipLog> selectedLogs = lipLogRepository.findAllById(logIds);

        String brand = "";
        String product = "";

        if (!selectedLogs.isEmpty()) {
            LipLog firstLog = selectedLogs.get(0);
            // LipLog -> ProductColor -> Product -> Brand 관계를 타고 명칭을 가져옴
            if (firstLog.getProductColor() != null && firstLog.getProductColor().getProduct() != null) {
                brand = firstLog.getProductColor().getProduct().getBrand().getName();
                product = firstLog.getProductColor().getProduct().getName();
            }
        }

        // 1. post를 먼저 선언 및 빌드
        CommunityPost post = CommunityPost.builder()
                .memo(memo)
                .brandName(brand)    // 📍 이 필드들이 CommunityPost 엔티티에 있어야 합니다.
                .productName(product)
                .build();

        // 2. 루프 안에서 사용
        selectedLogs.forEach(log -> {
            log.setCommunityPost(post); // 📍 이제 에러가 나지 않습니다.
            log.setIsPublic(true);
        });

        communityPostRepository.save(post);
    }

    // [Delete] 기록 삭제: 보관함에서 삭제 시 립로그 피드에서도 자동 삭제
    public void deleteLipLog(Integer id) {
        LipLog log = lipLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("기록을 찾을 수 없습니다."));

        // 📍 [핀셋] 해당 로그를 포함하고 있는 커뮤니티 포스트를 찾아 먼저 삭제
        communityPostRepository.findByLipLogsContaining(log).ifPresent(post -> {
            communityPostRepository.delete(post);
        });

        lipLogRepository.delete(log);
    }

    // --- Helper Methods ---

    private LipLogDTO.LipLogResponseDTO convertToResponseDTO(LipLog log) {
        // 기존의 꼼꼼한 매핑 로직 유지
        LipLogDTO.LipLogResponseDTO dto = new LipLogDTO.LipLogResponseDTO();
        dto.setLogId(log.getId());
        dto.setPhotoUrl(log.getPhotoUrl());
        dto.setMemo(log.getMemo());
        dto.setIsPublic(log.getIsPublic());
        dto.setCreatedAt(log.getCreatedAt());

        if (log.getProductColor() != null) {
            dto.setColorName(log.getProductColor().getColorName());
            if (log.getProductColor().getProduct() != null) {
                dto.setProductName(log.getProductColor().getProduct().getName());
                dto.setBrandName(log.getProductColor().getProduct().getBrand().getName());
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
        // 1. DB에서 해당 ID의 게시글 조회
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("해당 게시글을 찾을 수 없습니다. ID: " + postId));

        // 2. 엔티티를 DTO로 변환
        CommunityDTO.CommunityPostResponseDTO dto = new CommunityDTO.CommunityPostResponseDTO();
        dto.setPostId(post.getId());
        dto.setMemo(post.getMemo());
        dto.setCreatedAt(post.getCreatedAt() != null ? post.getCreatedAt().toString() : "");

        // 3. 연결된 이미지(LipLog) 목록 변환 및 대표 이미지 설정
        if (post.getLipLogs() != null && !post.getLipLogs().isEmpty()) {
            dto.setLipLogs(post.getLipLogs().stream()
                    .map(log -> modelMapper.map(log, LipLogDTO.LipLogResponseDTO.class))
                    .collect(Collectors.toList()));

            // 첫 번째 사진을 대표 이미지와 닉네임 기준으로 설정
            dto.setPhotoUrl(post.getLipLogs().get(0).getPhotoUrl());
            dto.setNickname(post.getLipLogs().get(0).getUser().getNickname());
        }

        return dto;
    }
}