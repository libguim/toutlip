package com.example.toutlip.dto;

import com.example.toutlip.domain.PersonalColorType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRegisterRequestDTO {
    @NotBlank(message = "아이디를 필수입니다.")
    private String username;

    @NotBlank(message = "비밀번호를 필수입니다.")
    @Size(min = 6, message = "비밀번호는 최소 6자 이상이어야 합니다.")
    private String password;

    @NotBlank(message = "닉네임을 입력해주세요.")
    private String nickname;

    @Email(message = "이메일 형식이 올바르지 않습니다.")
    private String email;

    private PersonalColorType personalColorType;
}