package com.example.toutlip.service;

import com.example.toutlip.domain.PersonalColorType;
import com.example.toutlip.domain.User;
import com.example.toutlip.dto.LoginDTO;
import com.example.toutlip.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class UserServiceTest {
    @Autowired
    private UserService userService;
    @Autowired private UserRepository userRepository;

    @Test
    @DisplayName("[User] 로그인 CRUD: 사용자 생성 후 로그인 및 DTO 반환 확인")
    void userLoginCrud() {
        // 1. Create: 테스트 사용자 저장
        User user = new User();
        user.setUsername("moana_service");
        user.setPassword("password123");
        user.setPersonalColorType(PersonalColorType.SPRING_WARM);
        userRepository.save(user);

        // 2. Read (Login): 로그인 로직 실행 및 응답 검증
        LoginDTO.LoginRequestDTO loginReq = new LoginDTO.LoginRequestDTO("moana_service", "password123");
        LoginDTO.LoginResponseDTO response = userService.login(loginReq);

        // 3. Verify: 개인화 메시지 및 설명 포함 여부 확인
        assertThat(response.getUsername()).isEqualTo("moana_service");
        assertThat(response.getPersonalColorDescription()).isEqualTo(PersonalColorType.SPRING_WARM.getDescription());
    }
}