package com.example.toutlip.repository;

import com.example.toutlip.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class UserRepositoryTest {
    @Autowired private UserRepository userRepository;

    @Test
    @DisplayName("사용자 CRUD: 생성, 조회, 수정, 삭제 전 과정 확인")
    void userFullCrud() {
        // 1. Create
        User user = new User();
        user.setUsername("moana_test");
        user.setPassword("pass123");
        User saved = userRepository.save(user);

        // 2. Read
        User found = userRepository.findByUsername("moana_test").orElseThrow();
        assertThat(found.getPassword()).isEqualTo("pass123");

        // 3. Update
        found.setPassword("new_pass");
        userRepository.flush();
        User updated = userRepository.findById(saved.getId()).orElseThrow();
        assertThat(updated.getPassword()).isEqualTo("new_pass");

        // 4. Delete
        userRepository.delete(updated);
        assertThat(userRepository.existsById(saved.getId())).isFalse();
    }
}