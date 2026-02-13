import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components'; // styled와 ThemeProvider 추가
import { theme } from './styles/theme'; // 방금 만드신 테마 파일

// 페이지 컴포넌트 임포트 (경로에 맞춰 수정 필요)
import TryOn from './pages/TryOn';
import LipLog from './pages/LipLog';
import MyProfile from './pages/MyProfile';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <AppWrapper>
                <MobileContainer> {/* 이 컨테이너가 중심을 잡아줍니다 */}
                    <Router>
                        <ContentArea>
                            <Routes>
                                <Route path="/" element={<TryOn />} />
                                <Route path="/liplog" element={<LipLog />} />
                                <Route path="/profile" element={<MyProfile />} />
                            </Routes>
                        </ContentArea>
                        <NavBar />
                    </Router>
                </MobileContainer>
            </AppWrapper>
        </ThemeProvider>
    );
}

// 스타일 정의

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
    height: calc(100% - 70px); // 네비게이션 바 높이 제외한 전체
    overflow-y: auto;
    &::-webkit-scrollbar { display: none; } // 스크롤바 숨김
`;

const NavBar = styled.nav`
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 70px;
  background: white;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid #eee;
  box-shadow: ${props => props.theme.shadows.soft}; // 테마의 그림자 적용
`;

const NavItem = styled(NavLink)`
    text-decoration: none;
    color: #666; // 비활성 상태
    font-weight: 500;
    transition: all 0.3s ease;

    &.active {
        color: ${props => props.theme.colors.champagneGold}; // 샴페인 골드 적용
        text-shadow: ${props => props.theme.shadows.glow};
        border-bottom: 2px solid ${props => props.theme.colors.roseGold}; // 하단은 로즈골드 라인
        padding-bottom: 5px;
    }
`;

export default App;