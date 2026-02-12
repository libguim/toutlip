package com.example.toutlip.controller;

import com.example.toutlip.dto.*;
import com.example.toutlip.service.LipLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/try-on")
@RequiredArgsConstructor
public class VirtualTryOnController {
    private final LipLogService lipLogService;

    /**
     * [Create] 가상 체험 결과 저장
     * MediaPipe로 합성된 화면을 캡처한 이미지와 선택했던 컬러 정보를 함께 저장합니다.
     */
    @PostMapping("/save")
    public ResponseEntity<LipLogDTO.LipLogResponseDTO> saveTryOnResult(@RequestBody LipLogDTO.LipLogRequestDTO dto) {
        // 서비스 로직을 통해 DB 저장 및 필요 시 커뮤니티 공유 로직 실행
        LipLogDTO.LipLogResponseDTO savedLog = lipLogService.createLipLog(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedLog);
    }
}
