package com.example.toutlip.controller;

import com.example.toutlip.domain.LipLog;
import com.example.toutlip.dto.CommunityDTO;
import com.example.toutlip.dto.LipLogDTO;
import com.example.toutlip.repository.LipLogRepository;
import com.example.toutlip.service.CommunityService;
import com.example.toutlip.service.LipLogService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/liplogs")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.PUT})
public class LipLogController {

    private final LipLogService lipLogService;
    private final LipLogRepository lipLogRepository;
    private final CommunityService communityService;

    @GetMapping("/public")
    public ResponseEntity<List<CommunityDTO.CommunityPostResponseDTO>> getPublicLogs(
            @RequestParam(required = false) Integer userId) {
        List<CommunityDTO.CommunityPostResponseDTO> logs = lipLogService.readPublicLogs(userId);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<LipLogDTO.LipLogResponseDTO>> getMyLogs(@PathVariable Integer userId) {
        return ResponseEntity.ok(lipLogService.readMyLogs(userId));
    }

    @PostMapping
    public ResponseEntity<LipLogDTO.LipLogResponseDTO> create(@RequestBody LipLogDTO.LipLogRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lipLogService.createLipLog(dto));
    }

    @PatchMapping("/{id}/public")
    public ResponseEntity<LipLogDTO.LipLogResponseDTO> updatePublicStatus(
            @PathVariable Integer id,
            @RequestBody LipLogDTO.LipLogRequestDTO dto) {
        return ResponseEntity.ok(lipLogService.updateLipLog(id, dto));
    }

    @PostMapping("/community")
    public ResponseEntity<?> createCommunityPost(@RequestBody CommunityDTO.CommunityPostRequestDTO dto) {
        List<Integer> logIds = dto.getLogIds();
        if (logIds == null || logIds.isEmpty() || logIds.size() > 5) {
            return ResponseEntity.badRequest().body(Map.of("message", "사진은 1~5장 선택 가능합니다."));
        }

        lipLogService.createMultiPhotoPost(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{logId}")
    public ResponseEntity<Void> deleteLipLog(@PathVariable Integer logId) {
        lipLogService.deleteLipLog(logId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/community/{postId}")
    public ResponseEntity<CommunityDTO.CommunityPostResponseDTO> getCommunityPost(@PathVariable Integer postId) {
        CommunityDTO.CommunityPostResponseDTO post = lipLogService.readPostDetail(postId);
        return ResponseEntity.ok(post);
    }

    @PutMapping("/community/{postId}")
    public ResponseEntity<?> updateCommunityPost(
            @PathVariable Integer postId,
            @RequestBody CommunityDTO.CommunityPostRequestDTO dto) {

        List<Integer> logIds = dto.getLogIds();

        if (logIds == null || logIds.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "수정할 사진 데이터가 유실되었습니다. 다시 선택해주세요."));
        }

        for (Integer logId : logIds) {
            if (logId == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "유효하지 않은 사진 데이터가 포함되어 있습니다."));
            }

            LipLog log = lipLogRepository.findById(logId)
                    .orElseThrow(() -> new EntityNotFoundException("로그를 찾을 수 없습니다."));

            if (log.getIsPublic() && (log.getCommunityPost() == null || !log.getCommunityPost().getId().equals(postId))) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "이 사진은 이미 다른 피드에 공유되었습니다. ✨"));
            }
        }

        lipLogService.updateCommunityPost(postId, dto);
        return ResponseEntity.ok(Map.of("message", "피드가 수정되었습니다. ✨"));
    }
}