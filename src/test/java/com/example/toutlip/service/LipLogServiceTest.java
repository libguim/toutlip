package com.example.toutlip.service;

import com.example.toutlip.domain.CommunityPost;
import com.example.toutlip.domain.LipLog;
import com.example.toutlip.dto.LipLogRequestDTO;
import com.example.toutlip.dto.LipLogResponseDTO;
import com.example.toutlip.repository.CommunityPostRepository;
import com.example.toutlip.repository.LipLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LipLogServiceTest {

    @InjectMocks
    private LipLogService lipLogService;

    @Mock
    private LipLogRepository lipLogRepository;

    @Mock
    private CommunityPostRepository communityPostRepository;

    @Mock
    private ModelMapper modelMapper;

    // 1. [Create] 기록 생성 및 공유 허용 시 검증
    @Test
    @DisplayName("기록 생성: 공유 허용 시 커뮤니티 게시글이 함께 생성되어야 한다")
    void createWithPublicTrue() {
        // given
        LipLogRequestDTO dto = new LipLogRequestDTO();
        dto.setIsPublic(true);

        LipLog lipLog = new LipLog();
        lipLog.setIsPublic(true);

        LipLog savedLog = new LipLog();
        savedLog.setId(1);
        savedLog.setIsPublic(true);

        when(modelMapper.map(any(LipLogRequestDTO.class), eq(LipLog.class))).thenReturn(lipLog);
        when(lipLogRepository.save(any(LipLog.class))).thenReturn(savedLog);
        when(modelMapper.map(any(LipLog.class), eq(LipLogResponseDTO.class))).thenReturn(new LipLogResponseDTO());

        // when
        lipLogService.createLipLog(dto);

        // then
        verify(lipLogRepository, times(1)).save(any(LipLog.class));
        verify(communityPostRepository, times(1)).save(any(CommunityPost.class));
    }

    // 2. [Read] 내 기록 최신순 조회 검증
    @Test
    @DisplayName("기록 조회: 특정 사용자의 기록을 최신순으로 가져와 DTO로 변환한다")
    void readMyLogs() {
        // given
        Integer userId = 1;
        List<LipLog> logs = List.of(new LipLog(), new LipLog());

        // 레포지토리의 변경된 함수명(findAllByUserIdOrderByCreatedAtDesc) 반영
        when(lipLogRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(logs);
        when(modelMapper.map(any(LipLog.class), eq(LipLogResponseDTO.class))).thenReturn(new LipLogResponseDTO());

        // when
        List<LipLogResponseDTO> result = lipLogService.readMyLogs(userId);

        // then
        assertThat(result).hasSize(2);
        verify(lipLogRepository, times(1)).findByUserIdOrderByCreatedAtDesc(userId);
    }

    // 3. [Update] 기록 수정 및 공유 상태 동기화 검증
    @Test
    @DisplayName("기록 수정: 비공개 기록을 공개로 변경하면 커뮤니티 게시글이 생성되어야 한다")
    void updateAndSyncCommunity() {
        // given
        Integer logId = 1;
        LipLog existingLog = new LipLog();
        existingLog.setIsPublic(false); // 기존엔 비공개

        LipLogRequestDTO updateDto = new LipLogRequestDTO();
        updateDto.setMemo("수정 메모");
        updateDto.setIsPublic(true); // 공개로 변경 요청

        when(lipLogRepository.findById(logId)).thenReturn(Optional.of(existingLog));
        when(modelMapper.map(any(LipLog.class), eq(LipLogResponseDTO.class))).thenReturn(new LipLogResponseDTO());

        // when
        lipLogService.updateLipLog(logId, updateDto);

        // then
        assertThat(existingLog.getMemo()).isEqualTo("수정 메모");
        verify(communityPostRepository, times(1)).save(any(CommunityPost.class));
    }

    // 4. [Delete] 기록 및 관련 포스트 삭제 검증
    @Test
    @DisplayName("기록 삭제: 로그를 삭제하면 연관된 커뮤니티 게시글도 함께 삭제되어야 한다")
    void deleteWithRelatedPost() {
        // given
        Integer logId = 1;
        LipLog existingLog = new LipLog();

        when(lipLogRepository.findById(logId)).thenReturn(Optional.of(existingLog));

        // when
        lipLogService.deleteLipLog(logId);

        // then
        verify(communityPostRepository, times(1)).deleteByLipLog(existingLog);
        verify(lipLogRepository, times(1)).delete(existingLog);
    }
}