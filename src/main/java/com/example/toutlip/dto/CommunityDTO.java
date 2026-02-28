package com.example.toutlip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

public class CommunityDTO {

    @Getter
    @Setter // 📍 데이터를 직접 채우기 위해 추가
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommunityPostRequestDTO {
        private List<Integer> logIds; // 다중 선택된 로그 ID 리스트
        private String memo;          // 커뮤니티 게시글용 메모
    }

    @Getter
    @Setter // 📍 서비스 레이어의 setNickname 등을 위해 필수!
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommunityPostResponseDTO {
        private Integer postId;
        private String nickname;
        private String userProfileImg;
        private String memo;
        private String authorPersonalColor;
        private String photoUrl;
        private String brandName;
        private String productName;
        private String colorName;
        private Integer viewCount;
        private Integer likeCount;

        private boolean isLiked;
        private String createdAt;

        private List<LipLogDTO.LipLogResponseDTO> lipLogs;
    }
}