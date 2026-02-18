import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components'; // styled와 ThemeProvider 추가
import { theme } from './styles/theme'; // 방금 만드신 테마 파일

// 페이지 컴포넌트 임포트 (경로에 맞춰 수정 필요)
import TryOn from './pages/TryOn';
import LipLog from './pages/LipLog';
import MyProfile from './pages/MyProfile';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <AppWrapper>
                <GlobalStyle /> {/* 전역 스타일 추가 권장 */}
                <MobileContainer>
                    <Router>
                        <ContentArea>
                            <Routes>
                                <Route path="/" element={<TryOn />} />
                                <Route path="/liplog" element={<LipLog />} />
                                <Route path="/profile" element={<MyProfile />} />
                            </Routes>
                        </ContentArea>

                        {/* 피그마 스타일의 다크 네비게이션 */}
                        <NavBar>
                            <NavItem to="/liplog">
                                <IconWrapper>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 8V12L15 15" strokeLinecap="round" />
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="M3.5 12C3.5 12 5 7 12 7" strokeLinecap="round" />
                                    </svg>
                                </IconWrapper>
                                <span>Lip Log</span>
                            </NavItem>

                            <NavItem to="/" end>
                                <IconWrapper className="camera-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19C23 19.5523 22.5523 20 22 20H2C1.44772 20 1 19.5523 1 19V8C1 7.44772 1.44772 7 2 7H7L9 4H15L17 7H22C22.5523 7 23 7.44772 23 8V19Z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                </IconWrapper>
                                <span>Try-On</span>
                                <div className="active-dot" />
                            </NavItem>

                            <NavItem to="/profile">
                                <IconWrapper>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </IconWrapper>
                                <span>Profile</span>
                            </NavItem>
                        </NavBar>
                    </Router>
                </MobileContainer>
            </AppWrapper>
        </ThemeProvider>
    );
}

// 스타일 정의

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    /* 테마의 darkBg 색상(#121212)으로 바닥 전체를 채웁니다. */
    background-color: #121212; 
    overflow: hidden; /* 전체 페이지 스크롤 방지 */
  }

  #root {
    width: 100%;
    height: 100%;
  }
`;

// 1. 전체 배경 (PC의 광활한 여백을 어둡게 채워줍니다)
const AppWrapper = styled.div`
    background-color: #000; // 또는 ${props => props.theme.colors.darkBg};
    min-height: 100vh;
    display: flex;
    justify-content: center; // 가로 정중앙
    align-items: center;     // 세로 정중앙
    color: ${props => props.theme.colors.softWhite};
`;

// 2. 실제 앱이 담기는 컨테이너 (모든 기기 대응 핵심)
const MobileContainer = styled.div`
    width: 100%;             // 모바일에서는 가로 꽉 차게
    max-width: 480px;        // PC에서는 이 너비까지만 커짐
    height: 100vh;           // 기본적으로 화면 높이에 맞춤
    background-color: ${props => props.theme.colors.darkBg};
    position: relative;
    overflow: hidden;
    box-shadow: ${props => props.theme.shadows.glow}; // 샴페인 골드 은은한 광택

    /* PC 브라우저 환경에서만 적용되는 고급스러운 디테일 */
    @media (min-width: 480px) {
        height: 90vh;          // 상하 여백을 주어 앱처럼 보이게 함
        border-radius: 40px;   // 모바일 기기 특유의 둥근 모서리
        border: 2px solid ${props => props.theme.colors.borderGold}; // 로즈골드 테두리
    }
`;

const ContentArea = styled.main`
    /* 화면 전체 높이에서 NavBar 높이(80px)를 뺍니다 */
    height: calc(100vh - 80px);
    width: 100%;
    position: relative;
    overflow-y: auto;
    background-color: ${props => props.theme.colors.darkBg};
    &::-webkit-scrollbar { display: none; }
`;

const NavBar = styled.nav`
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 80px;
    background: ${props => props.theme.colors.panelBg};
    display: flex;
    justify-content: space-around;
    align-items: center;
    border-top: 1px solid ${props => props.theme.colors.borderGold};
    z-index: 1000;
`;

const IconWrapper = styled.div`
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666; /* 비활성 색상 */
    transition: all 0.3s ease;

    svg { width: 100%; height: 100%; }
`;

const NavItem = styled(NavLink)`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-decoration: none;
    gap: 4px;
    position: relative;
    padding: 10px 0;

    span {
        font-size: 0.65rem;
        color: #666;
        font-weight: 500;
        transition: color 0.3s ease;
    }

    .active-dot {
        width: 3px;
        height: 3px;
        background-color: ${props => props.theme.colors.champagneGold};
        border-radius: 50%;
        margin-top: 4px;
        opacity: 0;
    }

    &.active {
        ${IconWrapper} {
            color: ${props => props.theme.colors.champagneGold};
            transform: translateY(-2px);
            filter: drop-shadow(0 0 5px ${props => props.theme.colors.goldGlow});
        }
        span {
            color: ${props => props.theme.colors.champagneGold};
        }
        .active-dot {
            opacity: 1;
        }
    }
`;

export default App;