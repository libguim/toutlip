package com.example.toutlip.service;

import com.example.toutlip.domain.CommunityPost;
import com.example.toutlip.dto.CommunityPostResponseDTO;
import com.example.toutlip.repository.CommunityPostRepository;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommunityServiceTest {

    @InjectMocks
    private CommunityService communityService;

    @Mock
    private CommunityPostRepository communityPostRepository;

    @Mock
    private ModelMapper modelMapper;

    // 1. [Read] 인기순 피드 조회 검증
    @Test
    @DisplayName("피드 조회: 모든 게시글을 조회수가 높은 순서대로 가져와 DTO로 변환한다")
    void findAllOrderByViewCount() {
        // given
        CommunityPost post1 = new CommunityPost();
        post1.setViewCount(100);
        CommunityPost post2 = new CommunityPost();
        post2.setViewCount(50);

        List<CommunityPost> posts = List.of(post1, post2);

        when(communityPostRepository.findAllByOrderByViewCountDesc()).thenReturn(posts);
        when(modelMapper.map(any(CommunityPost.class), eq(CommunityPostResponseDTO.class)))
                .thenReturn(new CommunityPostResponseDTO());

        // when
        List<CommunityPostResponseDTO> result = communityService.findAllOrderByViewCount();

        // then
        assertThat(result).hasSize(2);
        verify(communityPostRepository, times(1)).findAllByOrderByViewCountDesc();
    }

    // 2. [Update] 조회수 증가 검증
    @Test
    @DisplayName("조회수 증가: 게시글 ID를 전달하면 해당 게시글의 조회수가 1 증가해야 한다")
    void incrementViewCount() {
        // given
        Integer postId = 1;
        CommunityPost post = new CommunityPost();
        post.setViewCount(10);

        when(communityPostRepository.findById(postId)).thenReturn(Optional.of(post));

        // when
        communityService.incrementViewCount(postId);

        // then
        assertThat(post.getViewCount()).isEqualTo(11); // 기존 10에서 11로 증가 확인
        verify(communityPostRepository, times(1)).findById(postId);
    }

    // 3. [Delete] 게시글 삭제 검증
    @Test
    @DisplayName("게시글 삭제: 존재하는 게시글 ID로 삭제 요청 시 레포지토리의 삭제 메서드가 호출된다")
    void delete() {
        // given
        Integer postId = 1;
        when(communityPostRepository.existsById(postId)).thenReturn(true);

        // when
        communityService.delete(postId);

        // then
        verify(communityPostRepository, times(1)).deleteById(postId);
    }

    // 4. [Exception] 존재하지 않는 게시글 조회 시 예외 처리 검증
    @Test
    @DisplayName("예외 발생: 존재하지 않는 ID로 조회수 증가 요청 시 에러를 던진다")
    void incrementViewCountFail() {
        // given
        Integer postId = 99;
        when(communityPostRepository.findById(postId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> communityService.incrementViewCount(postId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("게시글을 찾을 수 없습니다.");
    }
}