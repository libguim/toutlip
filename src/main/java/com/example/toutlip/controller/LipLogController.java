package com.example.toutlip.controller;

import com.example.toutlip.dto.CommunityDTO;
import com.example.toutlip.dto.LipLogDTO;
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

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deleteCommunityPost(@PathVariable("postId") Integer postId) {
        // 📍 디버깅용: 서버 콘솔에 ID가 찍히는지 확인하세요.
        System.out.println("삭제 요청 들어온 ID: " + postId);

        lipLogService.deleteCommunityPost(postId);
        return ResponseEntity.ok().build();
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

}