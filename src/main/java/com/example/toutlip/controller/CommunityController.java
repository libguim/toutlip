package com.example.toutlip.controller;

import com.example.toutlip.dto.CommunityPostResponseDTO;
import com.example.toutlip.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {
    private final CommunityService communityService;

    // [Read] 인기순 피드 조회
    @GetMapping("/feed")
    public ResponseEntity<List<CommunityPostResponseDTO>> getCommunityFeed() {
        return ResponseEntity.ok(communityService.findAllOrderByViewCount());
    }

    // [Update] 게시글 상세 조회 시 조회수 증가
    @PatchMapping("/post/{id}/view")
    public ResponseEntity<Void> incrementView(@PathVariable Integer id) {
        communityService.incrementViewCount(id);
        return ResponseEntity.ok().build();
    }
}
