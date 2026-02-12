package com.example.toutlip.controller;

import com.example.toutlip.dto.LipLogDTO;
import com.example.toutlip.service.LipLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @PutMapping("/{id}")
    public ResponseEntity<LipLogDTO.LipLogResponseDTO> update(@PathVariable Integer id, @RequestBody LipLogDTO.LipLogRequestDTO dto) {
        // 기록 수정 및 커뮤니티 게시글 상태 동기화
        return ResponseEntity.ok(lipLogService.updateLipLog(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        lipLogService.deleteLipLog(id); // 기록 및 관련 포스트 삭제
        return ResponseEntity.noContent().build();
    }
}