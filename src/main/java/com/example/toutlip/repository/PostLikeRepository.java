package com.example.toutlip.repository;

import com.example.toutlip.domain.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Integer> {
    List<PostLike> findByCommunityPostId(Integer postId);

    // 📍 특정 유저가 특정 게시글에 좋아요를 눌렀는지 확인 (토글용)
    Optional<PostLike> findByUserIdAndCommunityPostId(Integer userId, Integer postId);
    long countByCommunityPostId(Integer postId);
}