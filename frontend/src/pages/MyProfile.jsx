import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const MyProfile = () => {
    const [myLogs, setMyLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. 유저의 로그 데이터 가져오기
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // 실제 연동 시 주석 해제: const response = await axios.get('/api/lip-log/my');
                // setMyLogs(response.data);

                // 임시 데이터 (디자인 확인용)
                setMyLogs([]);
            } catch (error) {
                console.error("데이터 로딩 실패:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    // 2. 토글 변경 핸들러
    // const handleToggle = async (id, currentStatus) => {
    //     const newStatus = !currentStatus;
    //     setMyLogs(prev => prev.map(log =>
    //         log.id === id ? { ...log, is_public: newStatus } : log
    //     ));
    //
    //     try {
    //         await axios.patch(`/api/lip-log/${id}/public`, { is_public: newStatus });
    //     } catch (error) {
    //         alert("변경에 실패했습니다.");
    //         setMyLogs(prev => prev.map(log =>
    //             log.id === id ? { ...log, is_public: currentStatus } : log
    //         ));
    //     }
    // };
    // MyProfile.js 내부의 토글 핸들러
    const handleToggle = async (id, currentStatus) => {
        const newStatus = !currentStatus;

        try {
            // 서버의 is_public 상태를 업데이트
            await axios.patch(`/api/lip-log/${id}/public`, { is_public: newStatus });

            // 상태 업데이트 후 알림
            if(newStatus) {
                alert("LIP LOG 피드에 공개되었습니다! 다른 모아나들과 공유 중이에요. 💋");
            } else {
                alert("피드에서 숨겨졌습니다. 이제 보관함에서만 볼 수 있어요.");
            }

            // 로컬 상태 업데이트
            setMyLogs(prev => prev.map(log =>
                log.id === id ? { ...log, is_public: newStatus } : log
            ));
        } catch (error) {
            alert("상태 변경에 실패했습니다.");
        }
    };

    if (loading) return <LoadingText>Finding your radiance...</LoadingText>;

    return (
        <ProfileContainer>
            {/* 상단 프로필 섹션 (이미지 기반 고정 디자인) */}
            <HeaderSection>
                <ProfileImageWrapper>
                    <img src="https://images.unsplash.com/photo-1581883556531-e5f8027f557f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=980" alt="Profile" />
                </ProfileImageWrapper>
                <UserName>Minji Kim</UserName>
                <UserGrade>VVIP MEMBER</UserGrade>
            </HeaderSection>

            {/* 통계 섹션 */}
            <StatSection>
                <StatItem>
                    <span className="count">{myLogs.length}</span>
                    <span className="label">POSTS</span>
                </StatItem>
                <StatItem>
                    <span className="count">1.2k</span>
                    <span className="label">FOLLOWERS</span>
                </StatItem>
                <StatItem>
                    <span className="count">85</span>
                    <span className="label">FOLLOWING</span>
                </StatItem>
            </StatSection>

            {/* 갤러리 영역 */}
            <ContentSection>
                <SectionTitle>
                    <GridIcon /> MY GALLERY
                </SectionTitle>

                {myLogs.length > 0 ? (
                    <GalleryGrid>
                        {myLogs.map((log) => (
                            <GalleryItem key={log.id}>
                                <img src={log.imageUrl} alt="Lip Log" />
                                <ToggleOverlay>
                                    <Switch>
                                        <input
                                            type="checkbox"
                                            checked={log.is_public}
                                            onChange={() => handleToggle(log.id, log.is_public)}
                                        />
                                        <span className="slider round"></span>
                                    </Switch>
                                </ToggleOverlay>
                                {log.is_public && <PublicBadge>Public</PublicBadge>}
                            </GalleryItem>
                        ))}
                    </GalleryGrid>
                ) : (
                    <EmptyGalleryCard>
                        <p>No saved looks yet.</p>
                    </EmptyGalleryCard>
                )}
            </ContentSection>

            {/* 메뉴 리스트 */}
            <MenuSection>
                <MenuItem>
                    <span>Personal Color Analysis</span>
                    <ArrowIcon />
                </MenuItem>
                <MenuItem>
                    <span>My Wishlist</span>
                    <ArrowIcon />
                </MenuItem>
            </MenuSection>
        </ProfileContainer>
    );
};

// --- Styled Components ---

const ProfileContainer = styled.div`
    padding: 40px 24px 120px 24px;
    background-color: #000;
    min-height: 100vh;
`;

const LoadingText = styled.div`
    height: 100vh; background: #000; color: #D1BA94;
    display: flex; justify-content: center; align-items: center;
`;

const HeaderSection = styled.div`
    display: flex; flex-direction: column; align-items: center; margin-bottom: 30px;
`;

const ProfileImageWrapper = styled.div`
    width: 90px; height: 90px; border-radius: 50%; overflow: hidden;
    border: 1.5px solid ${props => props.theme.colors.borderGold};
    margin-bottom: 12px;
    img { width: 100%; height: 100%; object-fit: cover; }
`;

const UserName = styled.h2` font-size: 1.3rem; font-weight: 500; color: #FFF; margin: 0; `;
const UserGrade = styled.span` font-size: 0.7rem; color: #D1BA94; letter-spacing: 2px; margin-top: 6px; `;

const StatSection = styled.div`
    display: flex; justify-content: space-around; padding: 20px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 30px;
`;

const StatItem = styled.div`
    display: flex; flex-direction: column; align-items: center;
    .count { font-size: 1.1rem; font-weight: 600; color: #FFF; }
    .label { font-size: 0.6rem; color: #666; margin-top: 4px; letter-spacing: 1px; }
`;

const ContentSection = styled.div` margin-bottom: 30px; `;
const SectionTitle = styled.h3` font-size: 0.8rem; color: #FFF; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; `;

const GalleryGrid = styled.div`
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
`;

const GalleryItem = styled.div`
    position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden;
    img { width: 100%; height: 100%; object-fit: cover; }
`;

const EmptyGalleryCard = styled.div`
    width: 100%; height: 160px; background: #0F0F0F; border-radius: 15px;
    display: flex; justify-content: center; align-items: center; border: 1px solid #1A1A1A;
    p { color: #444; font-size: 0.8rem; }
`;

const MenuSection = styled.div` display: flex; flex-direction: column; gap: 10px; `;
const MenuItem = styled.div`
    background: #0F0F0F; padding: 16px 20px; border-radius: 12px;
    display: flex; justify-content: space-between; align-items: center;
    span { font-size: 0.85rem; color: #BBB; }
`;

const PublicBadge = styled.span`
    position: absolute; top: 5px; right: 5px; background: #D1BA94; color: #000;
    font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600;
`;

const ToggleOverlay = styled.div` position: absolute; bottom: 5px; left: 5px; `;

const Switch = styled.label`
    position: relative; display: inline-block; width: 30px; height: 16px;
    input { opacity: 0; width: 0; height: 0; }
    .slider {
        position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
        background-color: #333; transition: .4s; border-radius: 34px;
    }
    .slider:before {
        position: absolute; content: ""; height: 12px; width: 12px; left: 2px; bottom: 2px;
        background-color: white; transition: .4s; border-radius: 50%;
    }
    input:checked + .slider { background-color: #D1BA94; }
    input:checked + .slider:before { transform: translateX(14px); }
`;

const GridIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D1BA94" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
);

const ArrowIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2.5">
        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default MyProfile;