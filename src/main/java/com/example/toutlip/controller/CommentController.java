package com.example.toutlip.controller;

import com.example.toutlip.dto.CommentDTO;
import com.example.toutlip.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // 댓글 작성: POST /api/comments
    @PostMapping
    public ResponseEntity<String> addComment(@RequestBody CommentDTO.CommentRequestDTO dto) {
        commentService.createComment(dto);
        return ResponseEntity.ok("댓글이 등록되었습니다! ✨");
    }

    // 댓글 조회: GET /api/comments/post/{postId}
    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentDTO.CommentResponseDTO>> getComments(@PathVariable Integer postId) {
        return ResponseEntity.ok(commentService.getCommentsByPost(postId));
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<String> update(@PathVariable Integer commentId, @RequestBody CommentDTO.CommentRequestDTO dto) {
        commentService.updateComment(commentId, dto.getContent(), dto.getUserId());
        return ResponseEntity.ok("수정 완료! ✨");
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<String> delete(@PathVariable Integer commentId, @RequestParam Integer userId) {
        commentService.deleteComment(commentId, userId);
        return ResponseEntity.ok("삭제 완료! 💄");
    }

}