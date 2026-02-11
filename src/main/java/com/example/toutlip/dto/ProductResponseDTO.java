package com.example.toutlip.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductResponseDTO {
    private Integer productId;
    private String name;
    private String category; // 예: 매트, 글로우, 틴트 등
    private String brandName; // ModelMapper가 brand.name을 자동으로 매핑합니다.
}