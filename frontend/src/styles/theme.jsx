export const theme = {
    colors: {
        // 배경: Jet Black & Charcoal
        darkBg: "#0a0a0a",        // bg-[#0a0a0a] (더 깊어진 메인 배경)
        panelBg: "#121212",       // surface: bg-[#121212] (카드 및 패널)

        // 텍스트: 화이트 & 그레이
        softWhite: "#f5f5f5",     // textPrimary: text-[#f5f5f5]
        textSecondary: "#a1a1aa", // textSecondary: text-[#a1a1aa]

        // 포인트: 누드 베이지 골드 (Accent)
        accent: "#E6C9A8",        // accent: text-[#E6C9A8]
        accentBg: "#E6C9A8",      // accentBg: bg-[#E6C9A8]

        // 경계선 및 효과
        borderGold: "#2a2a2a",    // border: border-[#2a2a2a]
        goldGlow: "rgba(230, 201, 168, 0.2)" // 변경된 accent 컬러에 맞춘 은은한 광택
    },
    shadows: {
        luxury: "0 10px 40px rgba(0, 0, 0, 0.7)",
        glow: "0 0 20px rgba(230, 201, 168, 0.15)" // 새로운 액센트 컬러 기반 아우라
    }
};