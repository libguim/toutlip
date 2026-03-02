package com.example.toutlip.dto;

import lombok.*;
import java.time.LocalDateTime;

public class CommentDTO {

    @Getter @Setter @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class CommentRequestDTO {
        private Integer userId;
        private Integer postId;
        private String content;
    }

    @Getter @Setter @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class CommentResponseDTO {
        private Integer commentId;
        private String content;
        private String nickname;      // 작성자 닉네임
        private String userProfileImg; // 작성자 프로필 이미지
        private Integer userId;
        private LocalDateTime createdAt;
    }
}