package com.example.toutlip.dto;

import com.example.toutlip.domain.PersonalColorType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {
    private Integer id;
    private String username;
    private String nickname;
    private String email;
    private PersonalColorType personalColorType;
    private String personalColorDescription;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}