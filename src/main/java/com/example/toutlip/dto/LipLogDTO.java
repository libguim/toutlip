package com.example.toutlip.dto;

import lombok.*;

import java.time.LocalDateTime;

public class LipLogDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LipLogRequestDTO { // 데이터 생성/수정용
        private Integer userId;      // 저장하는 사용자 ID
        private Integer colorId;     // 선택한 립 컬러 ID
        private String photoUrl;     // 촬영된 이미지 경로
        private String memo;         // 사용자 메모
        private Boolean isPublic;    // 커뮤니티 공개 여부
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LipLogResponseDTO { // 데이터 조회용
        private Integer logId;
        private String brandName;
        private String productName;
        private String colorName;
        private String hexCode;
        private String photoUrl;
        private String memo;
        private Boolean isPublic;
        private LocalDateTime createdAt; // BaseTimeEntity에서 제공하는 생성 시각
    }
}