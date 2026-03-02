package com.example.toutlip.repository;

import com.example.toutlip.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Integer> {
    // 📍 특정 게시글의 모든 댓글을 ID순(작성순)으로 조회
    List<Comment> findByCommunityPostIdOrderByIdAsc(Integer postId);

    // 📍 게시글 삭제 시 함께 카운트하거나 관리하기 위함
    long countByCommunityPostId(Integer postId);
}