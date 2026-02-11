package com.example.toutlip.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PersonalColorType {

    // 1. 상수 정의 (DB 저장용 이름)
    SPRING_WARM("봄 웜톤"),
    SUMMER_COOL("여름 쿨톤"),
    FALL_WARM("가을 웜톤"),
    WINTER_COOL("겨울 쿨톤"),
    NONE("미설정");

    // 2. 화면에 표시할 한글 설명
    private final String description;

    // 3. 필요하다면 특정 톤에 어울리는 대표 헥사코드를 담아둘 수도 있습니다.
}