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

    @Transactional(readOnly = true)
    public List<CommunityDTO.CommunityPostResponseDTO> readPublicLogs() {
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

                    if (post.getLipLogs() != null && !post.getLipLogs().isEmpty()) {
                        // 2. 연결된 사진(LipLog) 상세 매핑
                        dto.setLipLogs(post.getLipLogs().stream()
                                .map(log -> {
                                    LipLogDTO.LipLogResponseDTO logDto = modelMapper.map(log, LipLogDTO.LipLogResponseDTO.class);

                                    // 📍 [대원칙 핵심 핀셋] 엑박 방지: DB의 실제 경로를 DTO에 강제로 꽂아넣음
                                    // ModelMapper가 간혹 놓치는 photoUrl을 여기서 확실히 고정합니다.
                                    logDto.setPhotoUrl(log.getPhotoUrl());

                                    // 제품 컬러 및 브랜드 정보 매핑
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

                        // 3. 대표 데이터 설정 (첫 번째 사진 기준)
                        // 📍 여기서도 default-lip.png가 아닌 실제 추출된 photoUrl을 사용합니다.
                        if (!dto.getLipLogs().isEmpty()) {
                            dto.setPhotoUrl(dto.getLipLogs().get(0).getPhotoUrl());
                            dto.setBrandName(dto.getLipLogs().get(0).getBrandName());
                            dto.setProductName(dto.getLipLogs().get(0).getProductName());
                            // 📍 [핀셋 추가] 프론트엔드가 찾는 'images'라는 통로에도 데이터를 넣어줍니다.
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

        // 📍 [대원칙 1: 연결 해제 및 원본 복구]
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

        // 📍 [대원칙 2: 새로운 사진 연결]
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
        // 📍 [핀셋] 복제본(isPublic=true)은 제외하고 오직 '원본'만 가져와 갤러리 중복을 막습니다.
        return lipLogRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
//                .filter(log -> !log.getIsPublic())
//                .filter(log -> log.getIsPublic() != null && !log.getIsPublic())
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

//    @Transactional(readOnly = true)
//    public List<LipLogDTO.LipLogResponseDTO> readMyLogs(Integer userId) {
//        // 📍 [핀셋 교정] 모든 로그가 아니라, 공용 피드용이 아닌(원본) 사진만 필터링해서 가져옴
//        List<LipLog> logs = lipLogRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
//                .filter(log -> !log.getIsPublic()) // 📍 이 한 줄로 중복 노출 방지!
//                .collect(Collectors.toList());
//
//        return logs.stream()
//                .map(this::convertToResponseDTO)
//                .collect(Collectors.toList());
//    }

//    @Transactional
//    public void createMultiPhotoPost(List<Integer> logIds, String memo) {
//        // 1. 보관함 원본 사진 조회 (단순 조회이므로 원본은 변하지 않음)
//        List<LipLog> selectedLogs = lipLogRepository.findAllById(logIds);
//
//        // 2. 게시글 기본 정보 추출 (기존 로직 유지)
//        String brand = "";
//        String product = "";
//        if (!selectedLogs.isEmpty()) {
//            LipLog firstLog = selectedLogs.get(0);
//            if (firstLog.getProductColor() != null && firstLog.getProductColor().getProduct() != null) {
//                brand = firstLog.getProductColor().getProduct().getBrand().getName();
//                product = firstLog.getProductColor().getProduct().getName();
//            }
//        }
//
//        // 3. 새 게시글 생성
//        CommunityPost post = CommunityPost.builder()
//                .memo(memo)
//                .brandName(brand)
//                .productName(product)
//                .build();
//
//        // 4. 📍 [진짜 핀셋] 보관함 원본은 절대 건드리지 않고, '피드 전용 복사본' 객체들만 새로 만듦
//        List<LipLog> feedLogs = selectedLogs.stream().map(original -> {
//            return LipLog.builder()
//                    .user(original.getUser())
//                    .productColor(original.getProductColor())
//                    .photoUrl(original.getPhotoUrl()) // 동일한 이미지 주소만 사용
//                    .memo(original.getMemo())
//                    .isPublic(true)                   // 피드용이므로 true
//                    .communityPost(post)              // 새 게시글에만 연결 (원본의 연결은 유지됨)
//                    .build();
//        }).collect(Collectors.toList());
//
//        // 5. 게시글에 이 복사본 사진들만 담아서 저장
//        post.setLipLogs(feedLogs);
//        communityPostRepository.save(post);
//    }


    // LipLogService.java
//    @Transactional
//    public void createMultiPhotoPost(List<Integer> logIds, String memo) {
//        CommunityPost post = CommunityPost.builder().memo(memo).build();
//        CommunityPost savedPost = communityPostRepository.save(post);
//
//        // 📍 [대전환] 복제 없이 기존 사진들을 게시글에 '연결'
//        List<LipLog> selectedLogs = lipLogRepository.findAllById(logIds);
//        for (LipLog log : selectedLogs) {
//            log.setIsPublic(true);
//            log.setCommunityPost(savedPost);
//        }
//    }

    // LipLogService.java

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


//    @Transactional
//    public void createMultiPhotoPost(List<Integer> logIds, String memo) {
//        // 1. 보관함에서 뿌리 데이터(Originals)를 가져옴
//        List<LipLog> originals = lipLogRepository.findAllById(logIds);
//
//        // 2. 게시글 생성
//        CommunityPost post = CommunityPost.builder().memo(memo).build();
//
//        // 3. 📍 [핵심] 뿌리(Original)는 건드리지 말고, '새로운 복제본'을 만들어 연결
//        List<LipLog> clones = originals.stream().map(ori -> {
//            return LipLog.builder()
//                    .user(ori.getUser())
//                    .productColor(ori.getProductColor())
//                    .photoUrl(ori.getPhotoUrl()) // 이미지 경로만 따옴
//                    .isPublic(true)               // 피드용임을 표시
//                    .communityPost(post)          // 📍 여기서만 게시글 ID가 연결됨!
//                    .build();
//        }).collect(Collectors.toList());
//
//        post.setLipLogs(clones);
//        communityPostRepository.save(post);
//    }

    // LipLogService.java 내 deleteLipLog 메서드 수정
    @Transactional
    public void deleteLipLog(Integer logId) {
        // 🔍 [시작] 삭제 프로세스 진입 확인
        System.out.println("🚀 [DEBUG] deleteLipLog 시작 - logId: " + logId);

        LipLog target = lipLogRepository.findById(logId)
                .orElseThrow(() -> {
                    System.out.println("❌ [DEBUG] 사진을 찾을 수 없음 - logId: " + logId);
                    return new EntityNotFoundException("사진을 찾을 수 없습니다.");
                });

        // 📍 [핀셋 핵심] 부모(게시글) 유무 확인
        if (target.getCommunityPost() != null) {
            Integer postId = target.getCommunityPost().getId();
            CommunityPost postToDelete = target.getCommunityPost(); // 📍 삭제할 게시글 객체 미리 확보
            System.out.println("🔗 [DEBUG] 연관된 게시글 발견! - postId: " + postId);

            try {
                // 1. 관계 단절 확인
                target.setCommunityPost(null);
                System.out.println("✂️ [DEBUG] 1. 사진과 게시글 관계 해제 완료");

                // communityService.delete(postId) 대신 직접 repository를 사용해 확실히 지웁니다.
                communityPostRepository.delete(postToDelete);
                System.out.println("📡 [DEBUG] 2. 게시글 엔티티 삭제 명령 수행 완료");

                // 3. 동기화 확인
                communityPostRepository.flush();
                System.out.println("💾 [DEBUG] 3. 게시글 삭제 flush 완료");

            } catch (Exception e) {
                System.err.println("🔥 [DEBUG] 게시글 삭제 중 에러 발생: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("🍃 [DEBUG] 연관된 게시글이 없는 단독 사진입니다.");
        }

        // 📍 최종 사진 삭제 확인
        System.out.println("🗑️ [DEBUG] 최종 단계: 원본 사진(LipLog) 삭제 수행 중...");
        lipLogRepository.delete(target);
        lipLogRepository.flush();
        System.out.println("🏁 [DEBUG] deleteLipLog 프로세스 종료 성공!");
    }

    // LipLogService.java
//    @Transactional
//    public void deleteLipLog(Integer logId) {
//        // 1. 삭제할 사진(원본 또는 복제본) 조회
//        LipLog target = lipLogRepository.findById(logId)
//                .orElseThrow(() -> new EntityNotFoundException("사진을 찾을 수 없습니다."));
//
//        // 2. 📍 [핵심] 이 사진이 게시글(CommunityPost)에 속해 있는지 확인
//        if (target.getCommunityPost() != null) {
//            CommunityPost post = target.getCommunityPost();
//
//            // 3. 📍 1:1 관계이므로 이 사진이 삭제되면 게시글은 '빈 껍데기'가 됩니다.
//            // 따라서 게시글도 함께 삭제 명령을 내립니다.
//            communityPostRepository.delete(post);
//        }
//
//        // 4. 사진 데이터 삭제
//        lipLogRepository.delete(target);
//
//        // 5. 📍 DB에 즉시 반영 (유령 데이터 방지)
//        communityPostRepository.flush();
//        lipLogRepository.flush();
//    }

//    @Transactional
//    public void deleteLipLog(Integer logId) {
//        // 1. 삭제할 '특정' 사진 객체를 정확히 조회
//        LipLog target = lipLogRepository.findById(logId)
//                .orElseThrow(() -> new EntityNotFoundException("사진을 찾을 수 없습니다. ID: " + logId));
//
//        // 2. 이 사진이 게시글(CommunityPost)에 속해 있는지 확인
//        if (target.getCommunityPost() != null) {
//            CommunityPost post = target.getCommunityPost();
//
//            // 📍 [핀셋 핵심] 70번 게시글의 사진 리스트에서 '이 사진(target)'만 제거
//            // photoUrl이 같더라도 logId가 다른 71번 게시글의 사진은 리스트에서 빠지지 않음
//            post.getLipLogs().remove(target);
//
//            // 3. 사진을 제거한 후, 해당 게시글에 남은 사진이 0장이라면 게시글 자체를 삭제
//            if (post.getLipLogs().isEmpty()) {
//                communityPostRepository.delete(post);
//            }
//        }
//
//        // 4. 요청받은 그 사진 데이터(target)만 DB에서 삭제
//        lipLogRepository.delete(target);
//
//        // 📍 즉시 반영하여 프론트엔드와 데이터 동기화
//        communityPostRepository.flush();
//        lipLogRepository.flush();
//    }

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

//    @Transactional(readOnly = true)
//    public CommunityDTO.CommunityPostResponseDTO readPostDetail(Integer postId) {
//        // 1. DB에서 해당 ID의 게시글 조회
//        CommunityPost post = communityPostRepository.findById(postId)
//                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("해당 게시글을 찾을 수 없습니다. ID: " + postId));
//
//        // 2. 엔티티를 DTO로 변환
//        CommunityDTO.CommunityPostResponseDTO dto = new CommunityDTO.CommunityPostResponseDTO();
//        dto.setPostId(post.getId());
//        dto.setMemo(post.getMemo());
//        dto.setCreatedAt(post.getCreatedAt() != null ? post.getCreatedAt().toString() : "");
//
//        // 3. 연결된 이미지(LipLog) 목록 변환 및 대표 이미지 설정
//        if (post.getLipLogs() != null && !post.getLipLogs().isEmpty()) {
//            dto.setLipLogs(post.getLipLogs().stream()
//                    .map(log -> modelMapper.map(log, LipLogDTO.LipLogResponseDTO.class))
//                    .collect(Collectors.toList()));
//
//            // 첫 번째 사진을 대표 이미지와 닉네임 기준으로 설정
//            dto.setPhotoUrl(post.getLipLogs().get(0).getPhotoUrl());
//            dto.setNickname(post.getLipLogs().get(0).getUser().getNickname());
//        }
//
//        return dto;
//    }

    @Transactional(readOnly = true)
    public CommunityDTO.CommunityPostResponseDTO readPostDetail(Integer postId) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("게시글 없음"));

        CommunityDTO.CommunityPostResponseDTO dto = new CommunityDTO.CommunityPostResponseDTO();
        dto.setPostId(post.getId());
        dto.setMemo(post.getMemo());

        // 📍 [핀셋] post.getLipLogs()가 비어있지 않을 때만 안전하게 실행
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

            // 📍 [핀셋 확정] 변수가 선언된 if문 블록 안에서 안전하게 세팅하여 에러 방지
            dto.setLipLogs(logDtos);
            dto.setImages(logDtos);

            // 대표 이미지 설정
            dto.setPhotoUrl(logDtos.get(0).getPhotoUrl());
        }
        return dto;
    }



}