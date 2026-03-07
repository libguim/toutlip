package com.example.toutlip.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class LipLogDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LipLogRequestDTO { // 데이터 생성/수정용
        private Integer userId;      // 저장하는 사용자 ID
        private Integer baseColorId;  // 📍 [핀셋 추가] 베이스 컬러 ID
        private Integer pointColorId; // 📍 [핀셋 추가] 포인트 컬러 ID
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
        private Integer originalLogId; // 📍 [최종 추가] 원본 보관함 ID 추적용
        private String brandName;
        private String productName;
        private String colorName;
        private String hexCode;
        private String photoUrl;
        private String memo;
        private Boolean isPublic;
        private LocalDateTime createdAt; // BaseTimeEntity에서 제공하는 생성 시각
        private String nickname;
        private Integer likeCount;

        // 📍 [핀셋 추가] Base 컬러 상세 정보
        private String baseHex;       // 베이스 컬러의 Hex 코드
        private String baseBrand;     // 베이스 제품의 브랜드명
        private String baseProductName; // 베이스 제품명
        private String baseColorName;   // 베이스 컬러명

        // 📍 [핀셋 추가] Point 컬러 상세 정보
        private String pointHex;      // 포인트 컬러의 Hex 코드
        private String pointBrand;    // 포인트 제품의 브랜드명
        private String pointProductName; // 포인트 제품명
        private String pointColorName;   // 포인트 컬러명
    }

    // LipLogDTO.java 내부에 추가
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommunityPostResponseDTO {
        private Integer postId;
        private String nickname;
        private String userProfileImg;
        private String memo;
        private List<LipLogResponseDTO> lipLogs; // 📍 사진 여러 장이 담길 리스트
        private Integer likeCount;
        private LocalDateTime createdAt;
    }

}