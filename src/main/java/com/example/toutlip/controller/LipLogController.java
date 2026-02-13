package com.example.toutlip.controller;

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
public class LipLogController {
    private final LipLogService lipLogService;

    @PostMapping
    public ResponseEntity<LipLogDTO.LipLogResponseDTO> create(@RequestBody LipLogDTO.LipLogRequestDTO dto) {
        // 기록 생성 및 (isPublic이 true일 경우) 커뮤니티 게시글 자동 생성
        return ResponseEntity.status(HttpStatus.CREATED).body(lipLogService.createLipLog(dto));
    }

    @GetMapping("/user/{userId}")
    public List<LipLogDTO.LipLogResponseDTO> getMyLogs(@PathVariable Integer userId) {
        return lipLogService.readMyLogs(userId); // 내 기록 최신순 조회
    }

    @PatchMapping("/{id}/public")
    public ResponseEntity<LipLogDTO.LipLogResponseDTO> togglePublic(
            @PathVariable Integer id,
            @RequestBody Map<String, Boolean> request) {

        // 기존 update 로직을 활용하되, isPublic 필드만 부분 업데이트
        LipLogDTO.LipLogRequestDTO dto = new LipLogDTO.LipLogRequestDTO();
        dto.setIsPublic(request.get("is_public"));

        return ResponseEntity.ok(lipLogService.updateLipLog(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        lipLogService.deleteLipLog(id); // 기록 및 관련 포스트 삭제
        return ResponseEntity.noContent().build();
    }
}