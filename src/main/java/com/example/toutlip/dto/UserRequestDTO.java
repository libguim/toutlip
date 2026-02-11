package com.example.toutlip.dto;

import com.example.toutlip.domain.PersonalColorType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRequestDTO {
    @NotBlank(message = "아이디는 필수입니다")
    private String username;

    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다")
    private String password;

    @Email(message = "유효한 이메일 형식이 아닙니다")
    private String email;

    private PersonalColorType personalColorType;
}