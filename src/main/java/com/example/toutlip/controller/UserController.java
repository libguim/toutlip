package com.example.toutlip.controller;

import com.example.toutlip.domain.User;
import com.example.toutlip.dto.LoginDTO;
import com.example.toutlip.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user") // 프론트엔드 요청 경로와 일치시킴
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // 리액트 서버 허용
public class UserController {
    private final UserService userService;

    // [회원가입] 프론트엔드의 JOIN NOW 버튼과 연결됩니다.
    @PostMapping("/signup")
    public ResponseEntity<User> signup(@RequestBody User user) {
        // 서비스에서 유저를 저장하는 로직을 호출합니다.
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.save(user));
    }

    // [로그인]
    @PostMapping("/login")
    public ResponseEntity<LoginDTO.LoginResponseDTO> login(@RequestBody LoginDTO.LoginRequestDTO request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserInfo(@PathVariable Integer id) {
        // userService에 findById가 구현되어 있어야 합니다.
        return ResponseEntity.ok(userService.findById(id));
    }
}