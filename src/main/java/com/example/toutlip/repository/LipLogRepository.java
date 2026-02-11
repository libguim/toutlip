package com.example.toutlip.repository;

import com.example.toutlip.domain.LipLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LipLogRepository extends JpaRepository<LipLog, Integer> {
    // 특정 사용자의 립 로그 목록을 최신순으로 가져오기
    List<LipLog> findByUserIdOrderByCreatedAtDesc(Integer userId);

    // 커뮤니티에 공개된 로그들만 가져오기
    List<LipLog> findByIsPublicTrueOrderByCreatedAtDesc();
}
