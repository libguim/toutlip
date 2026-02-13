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

    @GetMapping("/{productId}/colors")
    public List<ProductDTO.ProductColorResponseDTO> getColorsByProduct(@PathVariable Integer productId) {
        return productService.findAllColorsByProduct(productId); // 제품별 컬러 상세
    }

    @GetMapping("/colors/all")
    public List<ProductDTO.ProductColorResponseDTO> getAllAvailableColors() {
        return productService.findAllAvailableColors(); // 카메라 탭 전체 컬러
    }
}