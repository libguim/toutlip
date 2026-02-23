package com.example.toutlip.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder // 📍 필수: 이게 있어야 @Builder.Default가 작동합니다.
@NoArgsConstructor // 📍 필수: JPA 엔티티 기본 생성자
@AllArgsConstructor // 📍 필수: 빌더 사용을 위한 전체 생성자
@Table(name = "community_post")
public class CommunityPost extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @OneToMany(
            mappedBy = "communityPost", // 📍 연관 관계의 주인인 LipLog의 필드명을 지정
            cascade = CascadeType.ALL,  // 📍 게시글 삭제 시 이미지도 함께 삭제되도록 설정
            orphanRemoval = true
    )
//    @JoinColumn(name = "community_post_id")
//    @Builder.Default
    private List<LipLog> lipLogs = new ArrayList<>();

    @Builder.Default
    private Integer viewCount = 0;

    @Builder.Default
    private Integer likeCount = 0;

    public void addLipLogs(List<LipLog> logs) {
        if (logs == null || logs.isEmpty() || logs.size() > 5) {
            throw new IllegalArgumentException("CommunityPost는 최소 1장, 최대 5장의 사진이 필요합니다.");
        }
        this.lipLogs.clear();
        this.lipLogs.addAll(logs);
    }

}