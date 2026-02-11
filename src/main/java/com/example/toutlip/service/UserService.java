package com.example.toutlip.service;

import com.example.toutlip.domain.User;
import com.example.toutlip.dto.LoginResponseDTO;
import com.example.toutlip.dto.UserRegisterRequestDTO;
import com.example.toutlip.dto.UserResponseDTO;
import com.example.toutlip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;

    // [Create] 회원가입: 비밀번호 암호화가 핵심입니다.
    public UserResponseDTO register(UserRegisterRequestDTO dto) {
        // 1. 중복 확인
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        }

        // 2. ModelMapper로 기본 필드 복사 (username, nickname, email 등)
        User user = modelMapper.map(dto, User.class);

        // 3. 비밀번호 암호화 (엔티티 내부의 의미 있는 메서드 활용)
        // setter 대신 엔티티가 스스로 암호화된 값을 갖도록 합니다.
        user.encodePassword(passwordEncoder, dto.getPassword());

        // 4. 저장 및 응답 변환
        User savedUser = userRepository.save(user);

        UserResponseDTO response = modelMapper.map(savedUser, UserResponseDTO.class);
        if (savedUser.getPersonalColorType() != null) {
            response.setPersonalColorDescription(savedUser.getPersonalColorType().getDescription());
        }
        return response;
    }

    // [Read] 중복 확인
    @Transactional(readOnly = true)
    public boolean checkNicknameDuplicate(String nickname) {
        return userRepository.existsByNickname(nickname);
    }

    // [Security] 스프링 시큐리티의 로그인 검증 로직
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 우리가 UserRepository에 추가했던 findByUsername을 여기서 사용합니다.
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));

        // 시큐리티 전용 User 객체로 변환하여 반환합니다.
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                new ArrayList<>() // 권한 목록 (현재는 일반 유저로 비워둠)
        );
    }

    // [Read] 내 정보 조회 (프로필 탭용)
    @Transactional(readOnly = true)
    public UserResponseDTO getMyInfo(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        UserResponseDTO response = modelMapper.map(user, UserResponseDTO.class);
        response.setPersonalColorDescription(user.getPersonalColorType().getDescription());

        return response;
    }

    // [Response] 로그인 성공 응답 생성
    public LoginResponseDTO createLoginResponse(User user) {
        LoginResponseDTO response = modelMapper.map(user, LoginResponseDTO.class);

        if (user.getPersonalColorType() != null) {
            response.setPersonalColorDescription(user.getPersonalColorType().getDescription());
        }

        response.setMessage("반가워요, " + user.getNickname() + "님! 오늘도 당신의 매력을 찾아보세요.");

        return response;
    }
}