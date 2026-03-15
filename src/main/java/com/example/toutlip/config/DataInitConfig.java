package com.example.toutlip.config;

import com.example.toutlip.dto.ProductDTO;
import com.example.toutlip.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataInitConfig implements CommandLineRunner {

    private final ProductService productService;

    @Override
    public void run(String... args) throws Exception {
        // 1. 외부 API 주소 (립스틱 데이터)
        String apiUrl = "https://makeup-api.herokuapp.com/api/v1/products.json?product_type=lipstick";

        RestTemplate restTemplate = new RestTemplate();

        try {
            // 2. 외부 데이터를 객체 배열로 받기
            ProductDTO.ExternalProductRequestDTO[] response =
                    restTemplate.getForObject(apiUrl, ProductDTO.ExternalProductRequestDTO[].class);

            if (response != null && response.length > 0) {
                // 3. ProductService의 동기화 로직 호출
                productService.syncExternalProducts(Arrays.asList(response));
                System.out.println("✅ [Tout Lip] 외부 데이터 동기화 성공!");
            }
        } catch (Exception e) {
            System.err.println("❌ [Tout Lip] 데이터 호출 중 에러 발생: " + e.getMessage());
        }
    }
}