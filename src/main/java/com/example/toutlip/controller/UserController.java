package com.example.toutlip.controller;

import com.example.toutlip.dto.LoginDTO;
import com.example.toutlip.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<LoginDTO.LoginResponseDTO> login(@RequestBody LoginDTO.LoginRequestDTO request) {
        // 아이디와 비밀번호를 검증하여 결과를 반환합니다.
        return ResponseEntity.ok(userService.login(request));
    }
}