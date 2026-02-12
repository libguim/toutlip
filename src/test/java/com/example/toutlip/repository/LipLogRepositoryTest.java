//package com.example.toutlip.repository;
//
//import com.example.toutlip.domain.LipLog;
//import com.example.toutlip.domain.ProductColor;
//import com.example.toutlip.domain.User;
//import org.junit.jupiter.api.DisplayName;
//import org.junit.jupiter.api.Test;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
//import org.springframework.boot.test.context.SpringBootTest;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.util.List;
//
//import static org.assertj.core.api.Assertions.assertThat;
//
//@SpringBootTest
//@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
//@Transactional
//class LipLogRepositoryTest {
//    @Autowired private LipLogRepository lipLogRepository;
//    @Autowired private UserRepository userRepository;
//    @Autowired private ProductColorRepository productColorRepository;
//
//    @Test
//    @DisplayName("립로그 CRUD: 사용자 기록의 생성 및 최신순 조회 확인")
//    void lipLogFullCrud() {
//        // 1. Create
//        User user = User.builder()
//                .username("moana_user")
//                .nickname("모아나")
//                .email("moana@example.com")
//                .password("1234")
//                .build();
//        userRepository.save(user);
//
//        ProductColor color = ProductColor.builder()
//                .name("릴리바이레드 포도바") // 예시 필드
//                .build();
//        productColorRepository.save(color);
//
//        LipLog lipLog = LipLog.builder()
//                .memo("오늘의 립 조합")
//                .isPublic(true)
//                .productColor(color)
//                .user(user)
//                .build();
//
//        // 2. Read (최신순)
//        List<LipLog> logs = lipLogRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
//        assertThat(logs).isNotEmpty();
//        assertThat(logs.get(0).getMemo()).isEqualTo("오늘의 립 조합");
//
//        // 3. Update
//        saved.setMemo("수정된 소감");
//        lipLogRepository.flush();
//        LipLog updated = lipLogRepository.findById(saved.getId()).orElseThrow();
//        assertThat(updated.getMemo()).isEqualTo("수정된 소감");
//
//        // 4. Delete
//        lipLogRepository.delete(saved);
//        assertThat(lipLogRepository.existsById(saved.getId())).isFalse();
//    }
//}