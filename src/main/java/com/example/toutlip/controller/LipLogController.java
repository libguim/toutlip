package com.example.toutlip.controller;

import com.example.toutlip.dto.CommunityDTO;
import com.example.toutlip.dto.LipLogDTO;
import com.example.toutlip.service.CommunityService;
import com.example.toutlip.service.LipLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/liplogs")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class LipLogController {
    private final LipLogService lipLogService;
    private final CommunityService communityService;

    // 커뮤니티 전체 피드 조회
    @GetMapping("/public")
    public ResponseEntity<List<CommunityDTO.CommunityPostResponseDTO>> getPublicLogs() {
        List<CommunityDTO.CommunityPostResponseDTO> logs = lipLogService.readPublicLogs();
        return ResponseEntity.ok(logs);
    }

    // 내 보관함 데이터 조회
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<LipLogDTO.LipLogResponseDTO>> getMyLogs(@PathVariable Integer userId) {
        return ResponseEntity.ok(lipLogService.readMyLogs(userId));
    }

    // 새로운 로그 생성
    @PostMapping
    public ResponseEntity<LipLogDTO.LipLogResponseDTO> create(@RequestBody LipLogDTO.LipLogRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lipLogService.createLipLog(dto));
    }

    @PatchMapping("/{id}/public")
    public ResponseEntity<LipLogDTO.LipLogResponseDTO> updatePublicStatus(
            @PathVariable Integer id,
            @RequestBody LipLogDTO.LipLogRequestDTO dto) { // 📍 Map 대신 DTO 직접 사용 권장

        return ResponseEntity.ok(lipLogService.updateLipLog(id, dto));
    }

    // LipLogController.java 에 추가
    // LipLogController.java 수정
    @PostMapping("/community")
    public ResponseEntity<?> createCommunityPost(@RequestBody CommunityDTO.CommunityPostRequestDTO dto) {
        // [수정 포인트] 사진 개수(logIds)가 3장 미만이거나 5장을 초과하는지 검증
        List<Integer> logIds = dto.getLogIds();

        if (logIds == null || logIds.isEmpty() || logIds.size() > 5) {
            // 조건에 맞지 않으면 400 Bad Request와 함께 메시지 반환
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "사진은 최소 1장에서 최대 5장까지 선택할 수 있습니다."));
        }

        // 검증 통과 시 서비스 로직 호출
        lipLogService.createMultiPhotoPost(dto.getLogIds(), dto.getMemo());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // 현재 코드 유지 (주소: /api/liplogs/user/log/{logId})
    @DeleteMapping("/user/log/{logId}")
    public ResponseEntity<Void> deleteUserLog(@PathVariable Integer logId) {
        lipLogService.deleteLipLog(logId); // 사진 삭제 + 연관 피드 자동 삭제
        return ResponseEntity.ok().build();
    }

    @GetMapping("/community/{postId}")
    public ResponseEntity<CommunityDTO.CommunityPostResponseDTO> getCommunityPost(@PathVariable Integer postId) {
        // 서비스 레이어에서 특정 postId에 해당하는 데이터를 가져오는 로직을 호출합니다.
        // 서비스에 해당 메서드가 없다면 추가 작성이 필요합니다.
        CommunityDTO.CommunityPostResponseDTO post = lipLogService.readPostDetail(postId);
        return ResponseEntity.ok(post);
    }

    @PutMapping("/community/{postId}")
    public ResponseEntity<?> updateCommunityPost(
            @PathVariable Integer postId,
            @RequestBody CommunityDTO.CommunityPostRequestDTO dto) {

        // 📍 1. 수정 시에도 사진 개수(1~5장) 검증을 수행합니다.
        List<Integer> logIds = dto.getLogIds();
        if (logIds == null || logIds.isEmpty() || logIds.size() > 5) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "사진은 최소 1장에서 최대 5장까지 선택할 수 있습니다."));
        }

        // 📍 2. 서비스 레이어의 수정 로직 호출
        lipLogService.updateCommunityPost(postId, dto);

        return ResponseEntity.ok(Map.of("message", "피드가 수정되었습니다. ✨"));
    }

    // LipLogController.java (또는 CommunityController)
    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deleteCommunityPost(@PathVariable Integer postId) {
        // CommunityService의 delete를 호출하여 '게시글'만 삭제 (사진은 보존)
        communityService.delete(postId);
        return ResponseEntity.ok().build();
    }

}