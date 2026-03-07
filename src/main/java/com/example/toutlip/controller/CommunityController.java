package com.example.toutlip.controller;

import com.example.toutlip.domain.PersonalColorType;
import com.example.toutlip.dto.CommunityDTO;
import com.example.toutlip.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.PUT})
public class CommunityController {
    private final CommunityService communityService;

    @GetMapping("/feed/popular")
    public List<CommunityDTO.CommunityPostResponseDTO> getPopularFeed() {
        return communityService.findAllOrderByViewCount(); // 인기순 피드
    }

    @GetMapping("/feed/color")
    public List<CommunityDTO.CommunityPostResponseDTO> getColorFeed(@RequestParam PersonalColorType type) {
        return communityService.findAllByPersonalColor(type); // 컬러 톤별 필터링
    }

    @PatchMapping("/{id}/view")
    public ResponseEntity<Void> updateViewCount(@PathVariable Integer id) {
        communityService.incrementViewCount(id); // 조회수 증가
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/like")
    public ResponseEntity<Void> updateLikeCount(
            @PathVariable Integer id,
            @RequestParam Integer userId) { // 📍 userId 파라미터 추가
        communityService.toggleLike(id, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Integer id) {
        communityService.delete(id); // 게시글 삭제
        return ResponseEntity.noContent().build();
    }
}