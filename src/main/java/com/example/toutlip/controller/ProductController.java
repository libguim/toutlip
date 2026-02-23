package com.example.toutlip.controller;

import com.example.toutlip.dto.ProductDTO;
import com.example.toutlip.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping("/brands")
    public List<ProductDTO.BrandResponseDTO> getAllBrands() {
        return productService.findAllBrands(); // 모든 브랜드 목록
    }

    @GetMapping("/brand/{brandId}")
    public List<ProductDTO.ProductResponseDTO> getProductsByBrand(@PathVariable Integer brandId) {
        return productService.findAllProductsByBrand(brandId); // 브랜드별 제품
    }

    @GetMapping("/brand/name/{brandName}")
    public List<ProductDTO.ProductColorResponseDTO> getProductsByBrandName(@PathVariable String brandName) {
        // Service에 이름 기반 검색 로직이 필요해
        return productService.findAllColorsByBrandName(brandName);
    }

    @GetMapping("/{productId}/colors")
    public List<ProductDTO.ProductColorResponseDTO> getColorsByProduct(@PathVariable Integer productId) {
        return productService.findAllColorsByProduct(productId); // 제품별 컬러 상세
    }

    @GetMapping("/colors/all")
    public List<ProductDTO.ProductColorResponseDTO> getAllAvailableColors() {
        return productService.findAllAvailableColors(); // 카메라 탭 전체 컬러
    }

    @PostMapping("/sync")
    public ResponseEntity<String> syncProducts(@RequestBody List<ProductDTO.ExternalProductRequestDTO> externalList) {
        productService.syncExternalProducts(externalList);
        return ResponseEntity.ok("선택하신 브랜드의 데이터가 성공적으로 DB에 저장되었습니다! ✨");
    }

    @GetMapping("/colors/brand/{brandName}")
    public List<ProductDTO.ProductColorResponseDTO> getColorsByBrand(@PathVariable String brandName) {
        // ProductService에 이미 만들어둔 메서드를 호출합니다.
        return productService.findAllColorsByBrandName(brandName);
    }
}