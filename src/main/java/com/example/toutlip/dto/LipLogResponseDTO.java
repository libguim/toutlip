package com.example.toutlip.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LipLogResponseDTO {
    private Integer logId;
    private String brandName;
    private String productName;
    private String colorName;
    private String hexCode;
    private String photoUrl;
    private String memo;
    private Boolean isPublic;
    private LocalDateTime createdAt;
}