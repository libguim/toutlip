package com.example.toutlip.repository;

import com.example.toutlip.domain.LipLog;
import com.example.toutlip.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class LipLogRepositoryTest {

    @Autowired
    private LipLogRepository lipLogRepository;

    @Autowired
    private UserRepository userRepository;

    // 1. [Create] 저장 검증
    @Test
    @DisplayName("기록 생성: 가상 체험 결과가 DB에 정상적으로 저장되는지 확인")
    void createLipLog() {
        // given
        User user = new User();
        user.setNickname("모아나");
        userRepository.save(user);

        LipLog log = new LipLog();
        log.setUser(user);
        log.setMemo("오늘의 꿀조합!");

        // when
        LipLog savedLog = lipLogRepository.save(log);

        // then
        assertThat(savedLog.getId()).isNotNull();
        assertThat(savedLog.getMemo()).isEqualTo("오늘의 꿀조합!");
    }

    // 2. [Read] 필터링 조회 검증
    @Test
    @DisplayName("공개 목록 조회: 공유 설정된 로그만 최신순으로 가져오는지 확인")
    void readPublicLogs() {
        // given
        LipLog privateLog = new LipLog();
        privateLog.setIsPublic(false);
        lipLogRepository.save(privateLog);

        LipLog publicLog = new LipLog();
        publicLog.setIsPublic(true);
        lipLogRepository.save(publicLog);

        // when
        List<LipLog> publicLogs = lipLogRepository.findByIsPublicTrueOrderByCreatedAtDesc();

        // then
        assertThat(publicLogs).hasSize(1);
        assertThat(publicLogs.get(0).getIsPublic()).isTrue();
    }

    // 3. [Update] 수정 검증
    @Test
    @DisplayName("기록 수정: 저장된 로그의 메모를 변경하면 DB에 반영되는지 확인")
    void updateLipLog() {
        // given
        LipLog log = new LipLog();
        log.setMemo("변경 전");
        LipLog saved = lipLogRepository.save(log);

        // when
        saved.setMemo("변경 후");
        lipLogRepository.flush(); // 영속성 컨텍스트의 변경 내용을 DB에 반영

        // then
        LipLog updated = lipLogRepository.findById(saved.getId()).orElseThrow();
        assertThat(updated.getMemo()).isEqualTo("변경 후");
    }

    // 4. [Delete] 삭제 검증
    @Test
    @DisplayName("기록 삭제: 로그를 삭제하면 DB에서 더 이상 조회되지 않는지 확인")
    void deleteLipLog() {
        // given
        LipLog log = new LipLog();
        LipLog saved = lipLogRepository.save(log);

        // when
        lipLogRepository.delete(saved);

        // then
        boolean exists = lipLogRepository.existsById(saved.getId());
        assertThat(exists).isFalse();
    }
}