package com.example.toutlip.repository;

import com.example.toutlip.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username); // 로그인용 필수!
    boolean existsByUsername(String username);     // 중복 가입 방지용
    boolean existsByNickname(String nickname);     // 닉네임 중복 체크
}