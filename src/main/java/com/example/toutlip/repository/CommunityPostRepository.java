package com.example.toutlip.repository;

import com.example.toutlip.domain.CommunityPost;
import com.example.toutlip.domain.LipLog;
import com.example.toutlip.domain.PersonalColorType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Integer> {
    // 조회수가 높은 순으로 인기 게시글 가져오기
    List<CommunityPost> findAllByOrderByViewCountDesc();

    // 퍼스널 컬러 타입별 필터링
    List<CommunityPost> findAllByLipLog_User_PersonalColorType(PersonalColorType type);

    // 특정 립로그와 연결된 포스트 삭제 (원본 로그 삭제 시 연동)
    void deleteByLipLog(LipLog lipLog);
}
