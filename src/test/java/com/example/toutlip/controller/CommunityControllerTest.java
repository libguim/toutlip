package com.example.toutlip.controller;

import com.example.toutlip.dto.CommunityPostResponseDTO;
import com.example.toutlip.service.CommunityService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CommunityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CommunityService communityService;

    // 1. [Read] 인기순 피드 조회 테스트
    @Test
    @DisplayName("피드 조회: GET 요청 시 인기순으로 정렬된 게시글 목록과 200 OK를 반환한다")
    void getCommunityFeed() throws Exception {
        // given
        CommunityPostResponseDTO post = new CommunityPostResponseDTO();
        post.setPostId(1);
        post.setBrandName("ToutLip");

        when(communityService.findAllOrderByViewCount()).thenReturn(List.of(post));

        // when & then
        mockMvc.perform(get("/api/community/feed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].brandName").value("ToutLip"))
                .andExpect(jsonPath("$.length()").value(1));

        verify(communityService, times(1)).findAllOrderByViewCount();
    }

    // 2. [Update] 조회수 증가 테스트
    @Test
    @DisplayName("조회수 증가: PATCH 요청 시 해당 ID의 조회수를 올리고 200 OK를 반환한다")
    void incrementView() throws Exception {
        // given
        Integer postId = 1;
        doNothing().when(communityService).incrementViewCount(postId);

        // when & then
        mockMvc.perform(patch("/api/community/post/{id}/view", postId))
                .andExpect(status().isOk());

        verify(communityService, times(1)).incrementViewCount(postId);
    }
}