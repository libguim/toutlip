package com.example.toutlip.controller;

import com.example.toutlip.dto.BrandResponseDTO;
import com.example.toutlip.dto.ProductColorResponseDTO;
import com.example.toutlip.dto.ProductResponseDTO;
import com.example.toutlip.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    // 모든 브랜드 목록 조회
    @GetMapping("/brands")
    public ResponseEntity<List<BrandResponseDTO>> getAllBrands() {
        return ResponseEntity.ok(productService.findAllBrands());
    }

    // 특정 브랜드의 제품 목록 조회
    @GetMapping("/brand/{brandId}")
    public ResponseEntity<List<ProductResponseDTO>> getProductsByBrand(@PathVariable Integer brandId) {
        return ResponseEntity.ok(productService.findAllProductsByBrand(brandId));
    }

    // 특정 제품의 컬러 정보 조회
    @GetMapping("/{productId}/colors")
    public ResponseEntity<List<ProductColorResponseDTO>> getColorsByProduct(@PathVariable Integer productId) {
        return ResponseEntity.ok(productService.findAllColorsByProduct(productId));
    }

    @GetMapping("/try-on/colors")
    public ResponseEntity<List<ProductColorResponseDTO>> getAvailableColors() {
        // 가상 체험에 최적화된 컬러 리스트를 반환
        return ResponseEntity.ok(productService.findAllAvailableColors());
    }
}