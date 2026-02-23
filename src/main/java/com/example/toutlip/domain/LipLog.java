package com.example.toutlip.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Table(name = "lip_log")
public class LipLog extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "color_id", nullable = false)
    private ProductColor productColor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_post_id") // CommunityPost의 @JoinColumn 이름과 맞춰야 합니다.
    @com.fasterxml.jackson.annotation.JsonIgnore // ⭐ 순환 참조 방지 (500 에러 해결의 핵심)
    private CommunityPost communityPost;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String photoUrl;

    private String memo;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isPublic = false;
}