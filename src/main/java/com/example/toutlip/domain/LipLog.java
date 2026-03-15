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
    @JoinColumn(name = "base_color_id", nullable = false)
    private ProductColor baseColor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "point_color_id")
    private ProductColor pointColor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_post_id")
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    @com.fasterxml.jackson.annotation.JsonIgnore // ⭐ 순환 참조 방지 (500 에러 해결의 핵심)
    private CommunityPost communityPost;

    @Lob
//    @Column(columnDefinition = "LONGTEXT")
    @Column(columnDefinition = "TEXT")
    private String photoUrl;

    private String memo;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isPublic = false;
}