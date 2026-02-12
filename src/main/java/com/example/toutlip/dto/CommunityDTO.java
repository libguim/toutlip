package com.example.toutlip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class CommunityDTO {

    // 1. 게시글 등록용 (로그 ID만 전달하여 생성)
    @Getter
    @Setter
    public static class CommunityPostRequestDTO {
        private Integer logId;
    }

    // 2. 커뮤니티 피드 조회용 (가장 복합적인 정보 전달)
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommunityPostResponseDTO {
        private Integer postId;
        private String nickname;            // 작성자 닉네임
        private String authorPersonalColor; // 작성자 퍼스널 컬러 (예: 봄 웜톤)
        private String photoUrl;            // LipLog의 사진
        private String brandName;           // 브랜드명
        private String productName;         // 제품명
        private String colorName;           // 컬러명
        private Integer viewCount;          // 조회수
        private Integer likeCount;          // 좋아요수
    }
}