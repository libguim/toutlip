package com.example.toutlip.service;

import com.example.toutlip.domain.Brand;
import com.example.toutlip.domain.Product;
import com.example.toutlip.domain.ProductColor;
import com.example.toutlip.dto.ProductDTO;
import com.example.toutlip.repository.BrandRepository;
import com.example.toutlip.repository.ProductColorRepository;
import com.example.toutlip.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final ProductColorRepository colorRepository;
    private final ModelMapper modelMapper;

    // --- [Read] 조회 로직 ---

    /**
     * 모든 브랜드 목록 조회
     */
    public List<ProductDTO.BrandResponseDTO> findAllBrands() {
        return brandRepository.findAll().stream()
                .map(brand -> modelMapper.map(brand, ProductDTO.BrandResponseDTO.class))
                .collect(Collectors.toList());
    }

    /**
     * 브랜드 ID별 제품 목록 조회
     */
    public List<ProductDTO.ProductResponseDTO> findAllProductsByBrand(Integer brandId) {
        return productRepository.findAllByBrandId(brandId).stream()
                .map(product -> modelMapper.map(product, ProductDTO.ProductResponseDTO.class))
                .collect(Collectors.toList());
    }

    private static final Set<String> TARGET_BRANDS = Set.of(
            "dior", "clinique", "smashbox",
            "colourpop", "fenty", "glossier", "nyx",
            "maybelline", "l'oreal", "revlon"
    );


    public List<ProductDTO.ProductColorResponseDTO> findAllColorsByBrandName(String brandName) {
        // 대소문자 구분 없이(IgnoreCase) 상위 20개를 가져오도록 메서드명을 맞춥니다.
        return colorRepository.findTop20ByProduct_Brand_NameIgnoreCase(brandName).stream()
                .map(color -> modelMapper.map(color, ProductDTO.ProductColorResponseDTO.class))
                .collect(Collectors.toList());
    }

    /**
     * 카메라 탭 전체 컬러칩 조회
     */
    public List<ProductDTO.ProductColorResponseDTO> findAllAvailableColors() {
        return colorRepository.findAll().stream()
                .map(color -> modelMapper.map(color, ProductDTO.ProductColorResponseDTO.class))
                .collect(Collectors.toList());
    }

    // --- [Update/Create] 외부 API 데이터 동기화 로직 ---

    /**
     * 외부 Makeup API 데이터 리스트를 받아 타겟 브랜드를 필터링하여 processJson으로 전달합니다.
     */
    @Transactional
    public void syncExternalProducts(List<ProductDTO.ExternalProductRequestDTO> externalList) {
        for (ProductDTO.ExternalProductRequestDTO ext : externalList) {
            // 1. 타겟 브랜드 필터링 (CHANEL, DIOR 등)
            if (isTargetBrand(ext.getBrand())) {
                // 2. 개별 제품 처리 로직 호출
                this.processJson(ext);
            }
        }
    }

    /**
     * [핀셋 수정] 단일 외부 제품 정보를 받아 DB 계층 구조(Brand -> Product -> Color)에 맞게 저장합니다.
     */
    private void processJson(ProductDTO.ExternalProductRequestDTO ext) {
        // 1. 브랜드 정보 처리 (기존 로직 유지)
        String brandName = (ext.getBrand() != null) ? ext.getBrand().toUpperCase() : "UNKNOWN";
        Brand brand = brandRepository.findByName(brandName)
                .orElseGet(() -> brandRepository.save(Brand.builder().name(brandName).build()));

        // 2. 제품 정보 처리 (기존 로직 유지)
        Product product = productRepository.findByName(ext.getName())
                .orElseGet(() -> productRepository.save(Product.builder().name(ext.getName()).brand(brand).build()));

        // 3. [핵심] 텍스처 분석 (저장 전 한 번만 수행)
        String detectedTexture = detectTexture(ext);

        // 4. 컬러 정보 저장 (중복 블록 제거하고 하나로 통합)
        if (ext.getProductColors() != null && !ext.getProductColors().isEmpty()) {
            for (ProductDTO.ExternalColorDTO colorDto : ext.getProductColors()) {
                String hexValue = colorDto.getHexValue();

                // Hex Code 정제 (# 붙이기)
                if (hexValue != null && !hexValue.startsWith("#")) {
                    hexValue = "#" + hexValue;
                }

                // [핀셋] 중복 체크 후 분석된 'detectedTexture'를 사용하여 저장합니다.
                if (hexValue != null && !colorRepository.existsByHexCode(hexValue)) {
                    ProductColor color = ProductColor.builder()
                            .product(product)
                            .colorName(colorDto.getColourName() != null ? colorDto.getColourName() : product.getName())
                            .hexCode(hexValue)
                            .texture(detectedTexture) // [중요] 분석 결과값 적용!
                            .build();

                    colorRepository.save(color);
                    System.out.println(">>> [" + detectedTexture + "] 컬러 저장 성공: " + hexValue);
                }
            }
        }
    }

    private String detectTexture(ProductDTO.ExternalProductRequestDTO ext) {
        // 1. 분석할 텍스트 통합 (이름 + 설명 + 태그)
        StringBuilder fullText = new StringBuilder();
        if (ext.getName() != null) fullText.append(ext.getName().toLowerCase()).append(" ");
        if (ext.getDescription() != null) fullText.append(ext.getDescription().toLowerCase()).append(" ");
        if (ext.getTagList() != null) fullText.append(String.join(" ", ext.getTagList()).toLowerCase());

        String text = fullText.toString();

        // 2. [보강] Glossy 판별 (가장 눈에 띄는 광택 키워드 우선)
        // 'cream'과 'satin'은 매트보다는 광택감이 있으므로 이쪽으로 분류하는 것이 체감상 더 정확합니다.
        if (text.contains("gloss") || text.contains("shine") || text.contains("shimmer") ||
                text.contains("lustre") || text.contains("cream") || text.contains("satin") ||
                text.contains("glass") || text.contains("balm")) {
            return "glossy";
        }

        // 3. [보강] Sheer 판별 (투명한 느낌)
        if (text.contains("sheer") || text.contains("transparent") || text.contains("water") || text.contains("tint")) {
            return "sheer";
        }

        // 4. [보강] Velvet 판별 (부드러운 세미매트)
        if (text.contains("velvet") || text.contains("soft") || text.contains("blur") || text.contains("chiffon")) {
            return "velvet";
        }

        // 5. 기본값은 matte
        // 'matte'라는 단어가 명시적으로 포함되어 있거나, 아무 키워드도 없을 때 적용됩니다.
        return "matte";
    }

    /**
     * 특정 브랜드만 필터링하는 헬퍼 메서드
     */
    private boolean isTargetBrand(String brandName) {
        if (brandName == null) return false;

        // 1. 양끝 공백을 제거하고 소문자로 변환
        String cleanBrand = brandName.trim().toLowerCase();

        // 2. TARGET_BRANDS 리스트와 하나라도 겹치는지 확인 (검색 최적화)
        return TARGET_BRANDS.stream()
                .anyMatch(target -> cleanBrand.contains(target) || target.contains(cleanBrand));
    }

    public List<ProductDTO.ProductColorResponseDTO> findAllColorsByProduct(Integer productId) {
        // 1. 레포지토리에서 productId로 컬러 엔티티 리스트를 가져옵니다.
        return colorRepository.findAllByProductId(productId).stream()
                // 2. 엔티티를 프론트엔드용 DTO로 변환합니다.
                .map(color -> modelMapper.map(color, ProductDTO.ProductColorResponseDTO.class))
                .collect(Collectors.toList());
    }
}