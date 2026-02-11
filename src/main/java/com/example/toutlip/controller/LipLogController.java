package com.example.toutlip.controller;

import com.example.toutlip.dto.LipLogRequestDTO;
import com.example.toutlip.dto.LipLogResponseDTO;
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

    // [Create] 새로운 립로그 생성
    @PostMapping
    public ResponseEntity<LipLogResponseDTO> createLipLog(@RequestBody LipLogRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lipLogService.createLipLog(dto));
    }

    // [Read] 특정 사용자의 내 기록 목록 조회
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<LipLogResponseDTO>> getMyLogs(@PathVariable Integer userId) {
        return ResponseEntity.ok(lipLogService.readMyLogs(userId));
    }

    // [Update] 기록 수정 (메모, 공개 여부 등)
    @PutMapping("/{id}")
    public ResponseEntity<LipLogResponseDTO> updateLipLog(@PathVariable Integer id, @RequestBody LipLogRequestDTO dto) {
        return ResponseEntity.ok(lipLogService.updateLipLog(id, dto));
    }

    // [Delete] 기록 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLipLog(@PathVariable Integer id) {
        lipLogService.deleteLipLog(id);
        return ResponseEntity.noContent().build();
    }
}
