package com.example.toutlip.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommunityPostResponseDTO {
    private Integer postId;
    private String nickname;
    private String authorPersonalColor; // 추가: "어떤 톤의 사용자가 썼나요?"
    private String photoUrl;
    private String brandName;
    private String productName;
    private String colorName;
    private Integer viewCount;
    private Integer likeCount;
}