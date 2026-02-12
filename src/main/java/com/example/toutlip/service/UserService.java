package com.example.toutlip.service;

import com.example.toutlip.domain.User;
import com.example.toutlip.dto.LoginDTO;
import com.example.toutlip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    public LoginDTO.LoginResponseDTO login(LoginDTO.LoginRequestDTO request) {
        // 1. 사용자 조회
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

        // 2. 비밀번호 확인 (단순 문자열 비교)
        if (!user.getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 3. ModelMapper를 이용한 자동 매핑
        LoginDTO.LoginResponseDTO response = modelMapper.map(user, LoginDTO.LoginResponseDTO.class);

        // 추가 정보 설정
        response.setPersonalColorDescription(user.getPersonalColorType().getDescription());
        response.setMessage("로그인에 성공하였습니다.");

        return response;
    }

}