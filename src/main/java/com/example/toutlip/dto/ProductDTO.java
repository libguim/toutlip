package com.example.toutlip.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

public class ProductDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BrandResponseDTO {
        private Integer brandId;
        private String name;
        private String logoUrl;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductResponseDTO {
        private Integer productId;
        private String name;
        private String category; // 예: 매트, 글로우, 틴트 등
        private String brandName; // 연관된 Brand 엔티티의 name 매핑용
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductColorResponseDTO {
        private Integer id;
        private String colorName;
        private String hexCode; // 화면에 띄울 실제 색상 코드 (예: #FF0000)
        private String texture; // 질감 정보
        private String productName; // 연관된 Product 엔티티의 name 매핑용
        private String brandName; // 제품을 통해 브랜드 이름까지 조회 시 사용
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExternalProductRequestDTO {
        private String brand;
        private String name;
        private String description;

        @JsonProperty("tag_list")
        private List<String> tagList;

        @JsonProperty("product_colors")
        private List<ExternalColorDTO> productColors;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExternalColorDTO {
        @JsonProperty("hex_value")
        private String hexValue;

        @JsonProperty("colour_name")
        private String colourName;
    }
}