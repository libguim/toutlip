package com.example.toutlip.repository;

import com.example.toutlip.domain.CommunityPost;
import com.example.toutlip.domain.LipLog;
import com.example.toutlip.domain.PersonalColorType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Integer> {

    // 1. 기존 로직 유지 (조회수 순 정렬)
    List<CommunityPost> findAllByOrderByViewCountDesc();

    // 2. [핀셋 교정] 리스트 구조에 맞춘 퍼스널 컬러 필터링
    // 게시글에 포함된 LipLog 리스트 중 하나라도 해당 퍼스널 컬러를 가진 유저의 것이라면 조회
//    List<CommunityPost> findAllByLipLogs_User_PersonalColorType(PersonalColorType type);
    List<CommunityPost> findAllByLipLogs_User_PersonalColorType(PersonalColorType type);

    // 3. [핀셋 교정] 특정 립로그 포함 여부 확인
    // existsByLipLog -> existsByLipLogsContaining (리스트 검색)
    boolean existsByLipLogsContaining(LipLog lipLog);

    // 4. [핀셋 교정] 특정 립로그를 포함하는 포스트 삭제
    // deleteByLipLog -> deleteByLipLogsContaining
    void deleteByLipLogsContaining(LipLog lipLog);

    // 5. 특정 립로그를 포함하는 포스트 단건 조회 (서비스 삭제 로직용)
    Optional<CommunityPost> findByLipLogsContaining(LipLog log);
}