package com.example.toutlip.service;

import com.example.toutlip.domain.Brand;
import com.example.toutlip.domain.Product;
import com.example.toutlip.domain.ProductColor;
import com.example.toutlip.dto.BrandResponseDTO;
import com.example.toutlip.dto.ProductColorResponseDTO;
import com.example.toutlip.dto.ProductResponseDTO;
import com.example.toutlip.repository.BrandRepository;
import com.example.toutlip.repository.ProductColorRepository;
import com.example.toutlip.repository.ProductRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @InjectMocks
    private ProductService productService;

    @Mock
    private BrandRepository brandRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductColorRepository colorRepository;

    @Mock
    private ModelMapper modelMapper;

    // 1. [Read] 모든 브랜드 목록 조회 검증
    @Test
    @DisplayName("브랜드 조회: DB에 저장된 모든 브랜드 목록을 가져와 DTO로 변환한다")
    void findAllBrands() {
        // given
        List<Brand> brands = List.of(new Brand(), new Brand());
        when(brandRepository.findAll()).thenReturn(brands);
        when(modelMapper.map(any(Brand.class), eq(BrandResponseDTO.class)))
                .thenReturn(new BrandResponseDTO());

        // when
        List<BrandResponseDTO> result = productService.findAllBrands();

        // then
        assertThat(result).hasSize(2);
        verify(brandRepository, times(1)).findAll();
    }

    // 2. [Read] 브랜드별 제품 목록 조회 검증
    @Test
    @DisplayName("제품 조회: 특정 브랜드 ID에 속한 모든 제품 목록을 가져온다")
    void findAllProductsByBrand() {
        // given
        Integer brandId = 1;
        List<Product> products = List.of(new Product());

        // 레포지토리의 직관적인 함수명(findAllByBrandId) 사용 확인
        when(productRepository.findAllByBrandId(brandId)).thenReturn(products);
        when(modelMapper.map(any(Product.class), eq(ProductResponseDTO.class)))
                .thenReturn(new ProductResponseDTO());

        // when
        List<ProductResponseDTO> result = productService.findAllProductsByBrand(brandId);

        // then
        assertThat(result).hasSize(1);
        verify(productRepository, times(1)).findAllByBrandId(brandId);
    }

    // 3. [Read] 제품별 컬러 정보 조회 검증
    @Test
    @DisplayName("컬러 조회: 특정 제품 ID에 속한 모든 컬러칩 정보를 가져온다")
    void findAllColorsByProduct() {
        // given
        Integer productId = 10;
        List<ProductColor> colors = List.of(new ProductColor(), new ProductColor());

        // 레포지토리의 직관적인 함수명(findAllByProductId) 사용 확인
        when(colorRepository.findAllByProductId(productId)).thenReturn(colors);
        when(modelMapper.map(any(ProductColor.class), eq(ProductColorResponseDTO.class)))
                .thenReturn(new ProductColorResponseDTO());

        // when
        List<ProductColorResponseDTO> result = productService.findAllColorsByProduct(productId);

        // then
        assertThat(result).hasSize(2);
        verify(colorRepository, times(1)).findAllByProductId(productId);
    }
}