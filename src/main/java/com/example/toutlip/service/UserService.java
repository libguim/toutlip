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

    @Transactional
    public User save(User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        }
        return userRepository.save(user);
    }

    public LoginDTO.LoginResponseDTO login(LoginDTO.LoginRequestDTO request) {
        // 1. 사용자 조회
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

        // 2. 비밀번호 확인
        if (!user.getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 3. DTO 매핑
        LoginDTO.LoginResponseDTO response = modelMapper.map(user, LoginDTO.LoginResponseDTO.class);

        // ★ [핵심 수정] 리액트의 화면 전환을 위해 id를 명시적으로 세팅합니다.
        response.setId(user.getId());

        // 4. 추가 정보 설정
        if (user.getPersonalColorType() != null) {
            response.setPersonalColorDescription(user.getPersonalColorType().getDescription());
        }

        response.setMessage("로그인에 성공하였습니다.");
        return response;
    }

    public User findById(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. ID: " + id));
    }
}