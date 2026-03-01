import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const Profile = () => {
    // --- 1. 상태 관리 ---
    const [isLoginView, setIsLoginView] = useState(true);
    const [userId, setUserId] = useState(localStorage.getItem("userId"));
    const [form, setForm] = useState({ username: '', password: '', nickname: '' });
    const [myLogs, setMyLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewLog, setViewLog] = useState(null); // 크게 보기 할 사진 데이터
    const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "Toutlip");


    // --- 2. 인증 핸들러 (회원가입 & 로그인) ---
    const handleAuth = async (e) => {
        e.preventDefault();
        
        // 1. [에러 해결] 서버로 보낼 데이터를 먼저 정의합니다.
        const authData = {
            username: form.username,
            password: form.password,
            nickname: isLoginView ? null : form.nickname,
            email: isLoginView ? null : form.email
        };

        const url = `http://localhost:8080/api/user/${isLoginView ? 'login' : 'signup'}`;
        
        try {
            const res = await axios.post(url, authData);
            
            if (isLoginView) {
                // 2. [중요] 서버 응답(res.data)에서 ID를 추출합니다. 
                // 서버 DTO 설정에 따라 id 또는 userId일 수 있으므로 둘 다 체크합니다.
                const loggedInId = res.data.id || res.data.userId; 
                const userNickname = res.data.nickname || res.data.username;

                if (loggedInId) {
                    // 3. 상태 업데이트를 실행하여 리액트가 화면을 바꾸게 합니다.
                    setUserId(loggedInId);
                    setNickname(userNickname);
                    
                    // 4. 브라우저 저장소에 기록
                    localStorage.setItem("userId", loggedInId);
                    localStorage.setItem("nickname", userNickname);
                    
                    alert(`${res.data.nickname || '모아나'}님, 환영합니다! ✨`);
                } else {
                    console.error("서버 응답에 ID가 없습니다:", res.data);
                    alert("로그인 정보를 처리할 수 없습니다.");
                }
            } else {
                alert("회원가입 성공! 이제 로그인해 보세요.");
                setIsLoginView(true);
            }
        } catch (err) {
            console.error("인증 에러:", err.response?.data);
            alert("입력 정보를 다시 확인해 주세요.");
        }
    };

    // --- 3. 데이터 로딩 (로그인 상태일 때 실행) ---
    useEffect(() => {
        if (userId) {
            // Profile.jsx 내부 fetchUserDataAndLogs 함수 핀셋 교정
            const fetchUserDataAndLogs = async () => {
                const currentUserId = localStorage.getItem("userId");
                if (!currentUserId || currentUserId === "null") return;

                setLoading(true);
                try {
                    // 📍 [핀셋] 백엔드 @RequestMapping("/api/liplogs")와 정확히 일치 (하이픈 제거)
                    const logRes = await axios.get(`http://localhost:8080/api/liplogs/user/${currentUserId}`);
                    
                    console.log("📥 보관함 수신 성공:", logRes.data);
                    
                    // 📍 [핀셋] 서버 응답 필드명이 logId임을 확인하고 데이터 세팅
                    if (Array.isArray(logRes.data)) {
                        setMyLogs(logRes.data);
                    }
                } catch (error) {
                    console.error("❌ 보관함 로딩 실패 (상태 코드):", error.response?.status);
                } finally {
                    setLoading(false);
                }
            };
            fetchUserDataAndLogs();
        }
    }, [userId]);

    // 📍 공유 핸들러: 메모 입력 기능을 포함합니다.
    const handleShareWithMemo = async (logId, nextStatus) => {
        if (!logId) return; // undefined 방지

        let memo = "";
        if (nextStatus) {
            // 공유 시 브라우저 프롬프트를 통해 메시지를 입력받습니다.
            memo = window.prompt("피드에 어떤 말을 남기고 싶으신가요? 💄", "오늘의 립 선택은 이거! ✨");
            if (memo === null) return; // 취소 시 중단
        }

        try {
            // 백엔드 PATCH 주소와 데이터 구조를 맞춥니다.
            await axios.patch(`http://localhost:8080/api/liplogs/${logId}/public`, {
                is_public: nextStatus,
                memo: memo
            });

            // 화면 즉시 반영
            setMyLogs(prev => prev.map(log => 
                log.logId === logId ? { ...log, isPublic: nextStatus, memo: memo || log.memo } : log
            ));

            alert(nextStatus ? "메모와 함께 피드에 멋지게 올라갔어요! 🌎" : "피드에서 내렸습니다.");
        } catch (err) {
            console.error("공유 실패:", err);
        }
    };

    // 📍 삭제 핸들러: logId로 정확한 삭제 요청 전송
    const handleDelete = async (logId) => {
        if (!logId || !window.confirm("이 소중한 기록을 삭제하시겠어요?")) return;

        try {
            await axios.delete(`http://localhost:8080/api/liplogs/${logId}`);
            setMyLogs(prev => prev.filter(log => log.logId !== logId));
            alert("기록이 깔끔하게 삭제되었습니다. 💄");
        } catch (err) {
            console.error("삭제 실패:", err);
        }
    };

    // 📍 커뮤니티 공유 핸들러 교정
    // Profile.jsx 내부 핸들러 수정
    const handleShareToCommunity = async (logId, nextStatus) => {
        if (!logId) return;

        let memo = "";
        // 1. 공유를 허용할 때만 메모 입력창을 띄웁니다.
        if (nextStatus) {
            memo = window.prompt("피드에 남길 짧은 메시지를 적어주세요! ✨", "오늘의 립 완성 💄");
            if (memo === null) return; // 취소 버튼 클릭 시 중단
        }

        try {
            // 2. PATCH 요청 시 메모 데이터도 함께 전송 (백엔드 update 로직 활용)
            await axios.patch(`http://localhost:8080/api/liplogs/${logId}/public`, {
                is_public: nextStatus,
                memo: memo // 📍 [핀셋 추가] 입력받은 메모 전달
            });

            // 3. 로컬 상태 업데이트
            setMyLogs(prev => prev.map(log => 
                log.logId === logId ? { ...log, isPublic: nextStatus, memo: memo || log.memo } : log
            ));

            alert(nextStatus ? "메모와 함께 피드에 게시되었습니다! 🌎" : "비공개로 전환되었습니다.");
        } catch (err) {
            console.error("공유 설정 실패:", err);
            alert("연결 상태를 확인해 주세요.");
        }
    };


    // --- 4. 조건부 렌더링 ---

    // A. 로그인 전 화면 (심플 인증 폼)
    if (!userId) {
        return (
            <AuthContainer>
                <h2 className="logo">TOUT LIP</h2>
                <p className="subtitle">{isLoginView ? "심연의 아름다움을 찾아서" : "새로운 여정의 시작"}</p>
                <form onSubmit={handleAuth}>
                <Input 
                    placeholder="ID" 
                    value={form.username}
                    onChange={e => setForm({...form, username: e.target.value})} 
                    required 
                />
                <Input 
                    type="password" 
                    placeholder="Password" 
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})} 
                    required 
                />
                {!isLoginView && (
                    <>
                        {/* 이메일 입력란 추가 */}
                        <Input 
                            type="email"
                            placeholder="Email (example@mail.com)" 
                            value={form.email || ''}
                            onChange={e => setForm({...form, email: e.target.value})} 
                            required 
                        />
                        <Input 
                            placeholder="Nickname" 
                            value={form.nickname}
                            onChange={e => setForm({...form, nickname: e.target.value})} 
                            required 
                        />
                    </>
                )}
                <SubmitButton type="submit">{isLoginView ? "SIGN IN" : "JOIN NOW"}</SubmitButton>
            </form>
                <ToggleText onClick={() => setIsLoginView(!isLoginView)}>
                    {isLoginView ? "처음이신가요? 회원가입" : "계정이 있다면? 로그인"}
                </ToggleText>
            </AuthContainer>
        );
    }

    // B. 로그인 후 화면 (기존 갤러리 로직 유지)
    return (
        <ProfileContainer>
            <HeaderSection>
                <ProfileImageWrapper>
                    <img src="https://images.unsplash.com/photo-1581883556531-e5f8027f557f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=980" alt="Profile" />
                </ProfileImageWrapper>
                <UserName>{nickname}</UserName> 
                <UserGrade>VVIP MEMBER</UserGrade>
                <LogoutBtn onClick={() => { 
                    localStorage.clear(); 
                    setUserId(null); 
                    setNickname("Moana"); // 로그아웃 시 초기화
                }}>LOGOUT</LogoutBtn>
            </HeaderSection>

            {/* <StatSection>
                <StatItem><span className="count">{myLogs.length}</span><span className="label">POSTS</span></StatItem>
                <StatItem><span className="count">1.2k</span><span className="label">FOLLOWERS</span></StatItem>
                <StatItem><span className="count">85</span><span className="label">FOLLOWING</span></StatItem>
            </StatSection> */}

            <StatsContainer>
                <StatItem>
                    {/* 1. myGalleryLogs 대신 현재 상태인 myLogs를 사용합니다. */}
                    <div className="count">{myLogs.length}</div>
                    <div className="label">MY LOGS</div>
                </StatItem>
                <StatItem>
                    {/* 2. SHARED는 내 로그들(myLogs) 중 isPublic이 true인 것만 필터링해서 카운트합니다. */}
                    <div className="count">{myLogs.filter(log => log.isPublic).length}</div>
                    <div className="label">SHARED</div>
                </StatItem>
                <StatItem>
                    <div className="count">24</div> {/* 추후 좋아요 API 연결 */}
                    <div className="label">FAVORITES</div>
                </StatItem>
            </StatsContainer>

            <ContentSection>
                <SectionTitle><GridIcon /> MY GALLERY</SectionTitle>
                {loading ? (
                    <LoadingTextSmall>Loading your looks...</LoadingTextSmall>
                ) : myLogs.length > 0 ? (

                // Profile.jsx 갤러리 렌더링 부분
                <GalleryGrid>
                    {myLogs.map((log) => (
                        <GalleryItem key={log.logId} onClick={() => setViewLog(log)}> {/* 📍 logId로 고유 키 설정 */}
                            <LogImage src={log.photoUrl} alt="Lip Log" />
                            
                            <LogOverlay className="overlay">
                                <div className="top-info">
                                    {/* 1. 찍은 날짜 표시 */}
                                    <span className="date">
                                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : 'Recent'}
                                    </span>
                                    
                                    {/* 2. 삭제 버튼 (logId 전달) */}
                                    <DeleteBtn onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(log.logId); 
                                    }}>
                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </DeleteBtn>
                                </div>

                                <div className="bottom-info">
                                    {/* 사진 조회 정보 */}
                                    <p className="product-info">{log.brandName} - {log.productName}</p>
                                </div>
                            </LogOverlay>
                        </GalleryItem>
                    ))}
                </GalleryGrid>
                    // <GalleryGrid>
                    //     {myLogs.map((log) => (
                    //         <GalleryItem key={log.id}>
                    //             <img src={log.photoUrl || log.imageUrl} alt="Lip Log" />
                    //             {log.isPublic && <PublicBadge>Public</PublicBadge>}
                    //         </GalleryItem>
                    //     ))}
                    // </GalleryGrid>
                ) : (
                    <EmptyGalleryCard><p>아직 저장된 룩이 없습니다.</p></EmptyGalleryCard>
                )}
            </ContentSection>

            {/* 📍 사진 상세 조회 및 다운로드 모달 */}
            {viewLog && (
                <ModalOverlay onClick={() => setViewLog(null)}>
                    <DetailModalContent onClick={(e) => e.stopPropagation()}>
                        <CloseBtn onClick={() => setViewLog(null)}>✕</CloseBtn>
                        <DetailImage src={viewLog.photoUrl} alt="Detail View" />
                        
                        <ModalActionArea>
                            <div className="info">
                                <h4>{viewLog.brandName}</h4>
                                <p>{viewLog.productName}</p>
                            </div>
                            {/* 📍 다운로드 버튼: 브라우저 기본 다운로드 유도 */}
                            <DownloadLink 
                                href={viewLog.photoUrl} 
                                download={`ToutLip_${viewLog.logId}.png`}
                            >
                                SAVE IMAGE
                            </DownloadLink>
                        </ModalActionArea>
                    </DetailModalContent>
                </ModalOverlay>
            )}
        </ProfileContainer>
    );
};

// --- 스타일 컴포넌트 생략 (기존 코드의 스타일을 그대로 유지하세요) ---
const LoadingTextSmall = styled.p` color: #666; font-size: 0.8rem; text-align: center; margin-top: 20px; `;

const AuthContainer = styled.div`
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100vh; background: #000; padding: 30px;
    .logo { color: #fff; letter-spacing: 5px; font-weight: 500; margin-bottom: 10px; }
    .subtitle { color: #D1BA94; font-size: 0.75rem; margin-bottom: 40px; letter-spacing: 2px; }
    form { display: flex; flex-direction: column; width: 100%; gap: 15px; max-width: 320px; }
`;

const Input = styled.input`
    background: #111; border: 1px solid #222; color: #fff; padding: 14px; border-radius: 12px;
    outline: none; transition: border 0.3s;
    &:focus { border-color: #D1BA94; }
`;

const SubmitButton = styled.button`
    background: #D1BA94; color: #000; padding: 14px; border: none; border-radius: 12px;
    font-weight: 600; cursor: pointer; margin-top: 10px;
`;

const ToggleText = styled.span` color: #666; margin-top: 25px; font-size: 0.8rem; cursor: pointer; text-decoration: underline; `;

const LogoutBtn = styled.button`
    background: transparent; border: 1px solid #333; color: #555; font-size: 0.6rem;
    padding: 4px 10px; border-radius: 4px; margin-top: 15px; cursor: pointer;
    &:hover { color: #D1BA94; border-color: #D1BA94; }
`;

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

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px 0;
  margin: 10px 20px;
  background: rgba(255, 255, 255, 0.03); /* 아주 살짝 밝은 배경으로 영역 구분 */
  border-radius: 15px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;

  /* 항목 사이의 얇은 구분선 */
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0;
    top: 20%;
    height: 60%;
    width: 1px;
    background: rgba(209, 186, 148, 0.2); /* 샴페인 골드빛 투명 선 */
  }

  .count {
    font-size: 1.2rem;
    font-weight: 700;
    color: #fff; /* 숫자는 흰색으로 선명하게 */
    margin-bottom: 4px;
  }

  .label {
    font-size: 0.65rem;
    font-weight: 500;
    color: #D1BA94; /* 라벨은 시그니처 골드 컬러 */
    letter-spacing: 1.5px; /* 자간을 넓혀 고급스러운 느낌 */
    text-transform: uppercase;
  }
`;

const ContentSection = styled.div` margin-bottom: 30px; `;
const SectionTitle = styled.h3` font-size: 0.8rem; color: #FFF; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; `;

const GalleryGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 3열 유지 */
    gap: 8px; /* 간격을 좁혀서 더 세련되게 */
    padding: 0 4px;
`;

const GalleryItem = styled.div`
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    border-radius: 8px;
    background-color: #111;

    &:hover .overlay { opacity: 1; }
`;

const LogOverlay = styled.div`
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 12px;
    opacity: 0;
    transition: opacity 0.3s ease;
    
    .top-info { display: flex; justify-content: space-between; align-items: center; }
    .date { font-size: 0.7rem; color: #D1BA94; }
    .bottom-info { display: flex; flex-direction: column; gap: 8px; }
    .product { color: #fff; font-size: 0.75rem; margin: 0; }
`;

const ShareActionButton = styled.button`
    background: ${props => props.$isPublic ? 'transparent' : '#D1BA94'};
    border: 1px solid #D1BA94;
    color: ${props => props.$isPublic ? '#D1BA94' : '#000'};
    padding: 6px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { transform: translateY(-2px); }
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

const LogImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover; /* 📍 핵심: 이미지가 찌그러지지 않고 영역을 가득 채움 */
    display: block;
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

// Profile.jsx 하단에 추가
const ShareButton = styled.button`
    background: ${props => props.$isPublic ? 'transparent' : '#D1BA94'};
    border: 1px solid #D1BA94;
    color: ${props => props.$isPublic ? '#D1BA94' : '#000'};
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    margin-top: 5px;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(209, 186, 148, 0.2);
    }
`;

const DeleteBtn = styled.button`
    background: none; border: none; color: #ff4d4d;
    cursor: pointer; transition: transform 0.2s;
    &:hover { transform: scale(1.2); }
`;

const DetailModalContent = styled.div`
    background: #111;
    width: 90%;
    max-width: 450px;
    border-radius: 20px;
    overflow: hidden;
    position: relative;
    border: 1px solid #222;
`;

const DetailImage = styled.img`
    width: 100%;
    aspect-ratio: 1 / 1.2;
    object-fit: cover;
`;

const ModalActionArea = styled.div`
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #000;

    .info h4 { color: #D1BA94; font-size: 0.9rem; margin: 0; letter-spacing: 1px; }
    .info p { color: #888; font-size: 0.75rem; margin: 4px 0 0 0; }
`;

const DownloadLink = styled.a`
    background: #D1BA94;
    color: #000;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.2s;

    &:hover { background: #fff; transform: translateY(-2px); }
`;

const CloseBtn = styled.button`
    position: absolute;
    top: 15px;
    right: 15px;
    background: rgba(0,0,0,0.5);
    color: #fff;
    border: none;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  backdrop-filter: blur(5px); /* 배경을 흐릿하게 만드는 효과 (선택 사항) */
  cursor: pointer; /* 배경 클릭 시 닫히는 느낌을 줄 때 */
`;

export default Profile;