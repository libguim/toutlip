package com.example.toutlip.service;

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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final ProductColorRepository colorRepository;
    private final ModelMapper modelMapper;

    // 모든 브랜드 목록 조회
    public List<ProductDTO.BrandResponseDTO> findAllBrands() {
        return brandRepository.findAll().stream()
                .map(brand -> modelMapper.map(brand, ProductDTO.BrandResponseDTO.class))
                .collect(Collectors.toList());
    }

    // 브랜드별 제품 목록 조회
    public List<ProductDTO.ProductResponseDTO> findAllProductsByBrand(Integer brandId) {
        return productRepository.findAllByBrandId(brandId).stream() // 레포지토리와 이름 통일
                .map(product -> modelMapper.map(product, ProductDTO.ProductResponseDTO.class))
                .collect(Collectors.toList());
    }

    // 공통 변환 로직 (private)
    private List<ProductDTO.ProductColorResponseDTO> convertToDtoList(List<ProductColor> colors) {
        return colors.stream()
                .map(color -> modelMapper.map(color, ProductDTO.ProductColorResponseDTO.class))
                .collect(Collectors.toList());
    }

    // 특정 제품용
    public List<ProductDTO.ProductColorResponseDTO> findAllColorsByProduct(Integer productId) {
        return convertToDtoList(colorRepository.findAllByProductId(productId));
    }

    // 카메라 탭 전체용
    public List<ProductDTO.ProductColorResponseDTO> findAllAvailableColors() {
        return convertToDtoList(colorRepository.findAll());
    }
}