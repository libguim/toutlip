package com.example.toutlip.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter @Setter
@Table(name = "community_posts")
public class CommunityPost extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "log_id")
    private LipLog lipLog;

    @Column(columnDefinition = "int default 0")
    private Integer viewCount;

    @Column(columnDefinition = "int default 0")
    private Integer likeCount;
}