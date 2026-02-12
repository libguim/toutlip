package com.example.toutlip.dto;

import com.example.toutlip.domain.PersonalColorType;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

public class LoginDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginRequestDTO {
        @NotBlank(message = "아이디를 입력해주세요.")
        private String username;

        @NotBlank(message = "비밀번호를 입력해주세요.")
        private String password;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginResponseDTO {
        private String username;
        private String nickname;
        private PersonalColorType personalColorType;
        private String personalColorDescription;
        private String message;
    }
}