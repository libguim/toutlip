package com.example.toutlip.service;

import com.example.toutlip.domain.CommunityPost;
import com.example.toutlip.domain.PersonalColorType;
import com.example.toutlip.dto.CommunityPostResponseDTO;
import com.example.toutlip.repository.CommunityPostRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CommunityService {
    private final CommunityPostRepository communityPostRepository;
    private final ModelMapper modelMapper;

    // 1. [Read] 인기순 피드 조회
    @Transactional(readOnly = true)
    public List<CommunityPostResponseDTO> findAllOrderByViewCount() {
        // 레포지토리의 정렬된 조회 함수를 사용하여 지혜롭게 데이터를 가져옵니다.
        return communityPostRepository.findAllByOrderByViewCountDesc().stream()
                .map(post -> modelMapper.map(post, CommunityPostResponseDTO.class))
                .collect(Collectors.toList());
    }

    // 2. [Update] 조회수 증가
    public void incrementViewCount(Integer id) {
        CommunityPost post = communityPostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        // 변경 감지(Dirty Checking)를 통해 조회수를 1 올립니다.
        post.setViewCount(post.getViewCount() + 1);
    }

    // 3. [Delete] 게시글 삭제
    public void delete(Integer id) {
        if (!communityPostRepository.existsById(id)) {
            throw new IllegalArgumentException("삭제할 게시글이 없습니다.");
        }
        communityPostRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<CommunityPostResponseDTO> findAllByPersonalColor(PersonalColorType type) {
        return communityPostRepository.findAllByLipLog_User_PersonalColorType(type).stream()
                .map(post -> modelMapper.map(post, CommunityPostResponseDTO.class))
                .collect(Collectors.toList());
    }
}