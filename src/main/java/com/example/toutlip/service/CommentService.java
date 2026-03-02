package com.example.toutlip.service;

import com.example.toutlip.domain.Comment;
import com.example.toutlip.domain.CommunityPost;
import com.example.toutlip.domain.User;
import com.example.toutlip.dto.CommentDTO;
import com.example.toutlip.repository.CommentRepository;
import com.example.toutlip.repository.CommunityPostRepository;
import com.example.toutlip.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final CommunityPostRepository communityPostRepository;

    // 📍 [핀셋] 댓글 작성 로직
    public void createComment(CommentDTO.CommentRequestDTO dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("유저를 찾을 수 없습니다."));
        CommunityPost post = communityPostRepository.findById(dto.getPostId())
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        Comment comment = Comment.builder()
                .content(dto.getContent())
                .user(user)
                .communityPost(post)
                .build();

        commentRepository.save(comment);
    }

    // 📍 [핀셋] 특정 게시글의 댓글 목록 조회 (작성순)
    @Transactional(readOnly = true)
    public List<CommentDTO.CommentResponseDTO> getCommentsByPost(Integer postId) {
        return commentRepository.findByCommunityPostIdOrderByIdAsc(postId).stream()
                .map(comment -> CommentDTO.CommentResponseDTO.builder()
                        .commentId(comment.getId())
                        .content(comment.getContent())
                        .nickname(comment.getUser().getNickname())
                        .userId(comment.getUser().getId())
                        // 프로필 이미지 엑박 방지 처리
                        .userProfileImg(comment.getUser().getProfileImg() != null ? comment.getUser().getProfileImg() : "default-avatar.png")
                        .createdAt(comment.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // 📍 [핀셋] 댓글 수정
    public void updateComment(Integer commentId, String newContent, Integer userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));

        // 본인 확인 로직
        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("자신의 댓글만 수정할 수 있습니다.");
        }

        comment.setContent(newContent);
    }

    // 📍 [핀셋] 댓글 삭제
    public void deleteComment(Integer commentId, Integer userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));

        // 본인 확인 로직
        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("자신의 댓글만 삭제할 수 있습니다.");
        }

        commentRepository.delete(comment);
    }
}