package com.example.toutlip.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductColorResponseDTO {
    private Integer id;
    private String colorName;
    private String hexCode; // 화면에 띄울 실제 색상 코드 (예: #FF0000)
    private String texture; // 질감 정보
    private String productName; // ModelMapper가 product.name을 자동으로 매핑합니다.
    private String brandName;
}