package com.example.toutlip.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LipLogRequestDTO {
    private Integer userId;      // 저장하는 사용자 ID
    private Integer colorId;     // 선택한 립 컬러 ID
    private String photoUrl;     // 촬영된 이미지 경로
    private String memo;         // 사용자 메모
    private Boolean isPublic;    // 커뮤니티 공개 여부 (토글 상태)
}