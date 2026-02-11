package com.example.toutlip.dto;

import com.example.toutlip.domain.PersonalColorType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDTO {
    private String username;
    private String nickname;
    private PersonalColorType personalColorType;
    private String personalColorDescription; // 예: "봄 웜톤"
    private String message; // "로그인에 성공하였습니다." 등 피드백 문구
}