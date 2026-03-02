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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false); // 편집 모드 토글 상태
    const [selectedLogIds, setSelectedLogIds] = useState([]); // 선택된 사진 ID들
    const [totalLikes, setTotalLikes] = useState(0); // 📍 [핀셋 추가] 전체 좋아요 합계


    // 📍 [핀셋 추가] 선택 토글 함수
    const toggleSelectLog = (logId) => {
        setSelectedLogIds(prev => 
            prev.includes(logId) 
                ? prev.filter(id => id !== logId) 
                : [...prev, logId]
        );
    };

    // 📍 [핀셋 추가] 전체 선택/해제
    const toggleSelectAll = () => {
        if (selectedLogIds.length === myLogs.length) {
            setSelectedLogIds([]);
        } else {
            setSelectedLogIds(myLogs.map(log => log.logId));
        }
    };

    // 📍 [핀셋 추가] 일괄 삭제 실행
    const handleDeleteSelected = async () => {
        if (selectedLogIds.length === 0) return;
        if (!window.confirm(`선택한 ${selectedLogIds.length}개의 기록을 모두 삭제할까요?`)) return;

        setLoading(true);
        try {
            // 병렬 삭제 처리
            await Promise.all(
                selectedLogIds.map(id => axios.delete(`http://localhost:8080/api/liplogs/${id}`))
            );
            alert("선택한 기록들이 모두 삭제되었습니다. ✨");
            setSelectedLogIds([]);
            setIsEditMode(false);
            fetchMyLogs(); // 목록 갱신
        } catch (err) {
            console.error("일괄 삭제 실패:", err);
            alert("일부 항목 삭제 중 에러가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // Profile.jsx 상단 상태 정의 아래에 추가
    const fetchMyLogs = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:8080/api/liplogs/user/${userId}`);
            // 📍 [대원칙 필터] 서버에서 필터링하지 않고 전체를 받아옵니다.
            setMyLogs(res.data);

            if (Array.isArray(res.data)) {
                const total = res.data.reduce((sum, log) => sum + (log.likeCount || 0), 0);
                setTotalLikes(total);
            }
        } catch (err) {
            console.error("로그 로딩 실패:", err);
        } finally {
            setLoading(false);
        }
    };

// 페이지 로드 시 실행
useEffect(() => {
    fetchMyLogs();

    // 📍 [핀셋 추가] 사용자가 다른 앱을 보다 다시 TOUT LIP으로 돌아오면 자동 갱신
    const handleFocus = () => fetchMyLogs();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
    
}, [userId]);



    const handleImageClick = (log) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };


    const handleDeleteWithConfirm = (logId) => {
        // 📍 사용자가 한 번 더 생각하게 만드는 시각적 장치
        const isConfirmed = window.confirm(
            "⚠️ 정말로 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, [립로그 탭]에 게시된 관련 포스트도 모두 삭제됩니다."
        );

        if (isConfirmed) {
            // 📍 확인되었을 때만 우리가 만든 '강력한 삭제' 로직 실행
            handleDelete(logId);
            setViewLog(null); // 모달 닫기
        }
    };


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
    const fetchUserDataAndLogs = async () => {
        const currentUserId = localStorage.getItem("userId");
        if (!currentUserId || currentUserId === "null") return;

        setLoading(true);
        try {
            // 📍 [핀셋] 백엔드 @RequestMapping("/api/liplogs")와 정확히 일치 (하이픈 제거)
            const logRes = await axios.get(`http://localhost:8080/api/liplogs/user/${currentUserId}`);
            
            console.log("📥 보관함 수신 성공:", logRes.data);
            
            // 📍 [핀셋] 서버 응답 필드명이 logId임을 확인하고 데이터 세팅
            // if (Array.isArray(logRes.data)) {
            //     setMyLogs(logRes.data);
            // }
            if (Array.isArray(logRes.data)) {
                setMyLogs(logRes.data);
                
                // 📍 [핀셋 추가] 내가 얻은 전체 좋아요 수 실시간 계산
                const total = logRes.data.reduce((sum, log) => sum + (log.likeCount || 0), 0);
                setTotalLikes(total);
                console.log("✨ FAVORITES 최신화 완료:", total);
            }
        } catch (error) {
            console.error("❌ 보관함 로딩 실패 (상태 코드):", error.response?.status);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchUserDataAndLogs();

            const handleRefresh = () => {
                console.log("🔄 화면 이동 감지: FAVORITES 수치를 최신화합니다.");
                fetchUserDataAndLogs();
            };

            window.addEventListener('focus', handleRefresh); // 창/탭 포커스 시 실행
            return () => {
                // 메모리 누수 방지를 위한 클린업
                window.removeEventListener('focus', handleRefresh);
            };
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
    // const handleDelete = async (logId) => {
    //     if (!logId || !window.confirm("이 소중한 기록을 삭제하시겠어요?")) return;

    //     try {
    //         await axios.delete(`http://localhost:8080/api/liplogs/${logId}`);
    //         setMyLogs(prev => prev.filter(log => log.logId !== logId));
    //         alert("기록이 깔끔하게 삭제되었습니다. 💄");
    //     } catch (err) {
    //         console.error("삭제 실패:", err);
    //     }
    // };
// 📍 Profile.jsx 내부의 handleDelete 함수를 이렇게 수정해줘

// Profile.jsx 내 handleDelete 함수 교정
// Profile.jsx 163라인 부근
const handleDelete = async (logId) => {
    // 📍 [체크] 전달받는 값이 post.postId가 아니라 log.logId여야 합니다!
    if (!logId || !window.confirm("이 기록을 삭제하면 립로그 탭의 게시글도 함께 사라집니다.")) return;

    try {
        console.log(`%c[원칙 집행] 삭제 시도 ID: ${logId}`, "color: #e67e22; font-weight: bold;");
        const response = await axios.delete(`http://localhost:8080/api/liplogs/${logId}`);

        if (response.status === 200) {
            // UI 업데이트
            setMyLogs(prev => prev.filter(log => log.logId !== logId));
            setViewLog(null); 
            alert("이미지와 관련 게시글이 모두 삭제되었습니다. ✨");
        }
    } catch (err) {
        // console.error("삭제 실패 상세:", err.response?.data || err.message);
        console.error("삭제 실패: 혹시 게시글에서 사용 중인 사진인가요?", err.response?.data);
        alert("삭제 실패: 서버 설정을 확인해 주세요.");
    }
};

// Profile.jsx 내 삭제 핸들러 수정
const handleDeleteLog = async (logId) => {
    if (!window.confirm("정말 삭제하시겠습니까? 관련 게시글도 모두 삭제됩니다.")) return;
    
    try {
        await axios.delete(`http://localhost:8080/api/liplogs/${logId}`);
        alert("삭제되었습니다.");
        // 📍 [핀셋] 삭제 후 즉시 서버 데이터를 다시 로드하여 화면 갱신
        fetchMyLogs(); 
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
    // return (
    //     <ProfileContainer>
    //         <HeaderSection>
    //             <ProfileImageWrapper>
    //                 <img src="https://images.unsplash.com/photo-1581883556531-e5f8027f557f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=980" alt="Profile" />
    //             </ProfileImageWrapper>
    //             <UserName>{nickname}</UserName> 
    //             <UserGrade>VVIP MEMBER</UserGrade>
    //             <LogoutBtn onClick={() => { 
    //                 localStorage.clear(); 
    //                 setUserId(null); 
    //                 setNickname("Moana"); // 로그아웃 시 초기화
    //             }}>LOGOUT</LogoutBtn>
    //         </HeaderSection>

    //         <StatsContainer>
    //             <StatItem>
    //                 {/* 1. myGalleryLogs 대신 현재 상태인 myLogs를 사용합니다. */}
    //                 <div className="count">{myLogs.length}</div>
    //                 <div className="label">MY LOGS</div>
    //             </StatItem>
    //             <StatItem>
    //                 {/* 2. SHARED는 내 로그들(myLogs) 중 isPublic이 true인 것만 필터링해서 카운트합니다. */}
    //                 <div className="count">{myLogs.filter(log => log.isPublic).length}</div>
    //                 <div className="label">SHARED</div>
    //             </StatItem>
    //             <StatItem>
    //                 <div className="count">24</div> {/* 추후 좋아요 API 연결 */}
    //                 <div className="label">FAVORITES</div>
    //             </StatItem>
    //         </StatsContainer>

    //         <ContentSection>
    //             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
    //                 <SectionTitle style={{ margin: 0 }}><GridIcon /> MY GALLERY</SectionTitle>
    //                 <button 
    //                     onClick={() => { setIsEditMode(!isEditMode); setSelectedLogIds([]); }}
    //                     style={{ background: 'none', border: 'none', color: '#D1BA94', fontSize: '0.8rem', cursor: 'pointer' }}
    //                 >
    //                     {isEditMode ? 'CANCEL' : 'EDIT'}
    //                 </button>
    //             </div>

    //             {/* 📍 [핀셋 추가] 편집 모드 상단 바 (image_511ad6.png 컨셉) */}
    //             {isEditMode && (
    //                 <EditActionBar>
    //                     <div className="left" onClick={toggleSelectAll}>
    //                         <div className={`checkbox ${selectedLogIds.length === myLogs.length ? 'checked' : ''}`} />
    //                         <span>ALL ({selectedLogIds.length})</span>
    //                     </div>
    //                     <button className="delete-btn" onClick={handleDeleteSelected} disabled={selectedLogIds.length === 0}>
    //                         DELETE SELECTED
    //                     </button>
    //                 </EditActionBar>
    //             )}

    //             {loading ? (
    //                 <LoadingTextSmall>Loading your looks...</LoadingTextSmall>
    //             ) : (
    //                 <GalleryGrid>
    //                     {myLogs.map((log) => (
    //                         <GalleryItem 
    //                             key={log.logId}
    //                             $isSelected={selectedLogIds.includes(log.logId)}
    //                             onClick={() => isEditMode ? toggleSelectLog(log.logId) : setViewLog(log)}
    //                         >
    //                             <LogImage src={log.photoUrl} alt="Lip Log" />
                                
    //                             {/* 📍 [핀셋 추가] 선택 모드 시 체크박스 노출 */}
    //                             {isEditMode && (
    //                                 <div className={`select-indicator ${selectedLogIds.includes(log.logId) ? 'checked' : ''}`}>
    //                                     {selectedLogIds.includes(log.logId) && '✓'}
    //                                 </div>
    //                             )}
                                
    //                             {log.isPublic && <div className="shared-badge">SHARED</div>}
    //                         </GalleryItem>
    //                     ))}
    //                 </GalleryGrid>
    //             )}
    //         </ContentSection>


    //         {viewLog && (
    //             <ModalOverlay onClick={() => setViewLog(null)}>
    //                 <DetailModalContent onClick={(e) => e.stopPropagation()}>
    //                     <CloseBtn onClick={() => setViewLog(null)}>✕</CloseBtn>
    //                     <DetailImage src={viewLog.photoUrl} alt="Detail View" />
                        
    //                     <ModalActionArea>
    //                         <div className="info">
    //                             {/* 📍 날짜 추가: 브랜드명 위에 작고 연하게 배치하면 세련돼 보여 */}
    //                             <p style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>
    //                                 {new Date(viewLog.createdAt).toLocaleDateString()}
    //                             </p>
    //                             {/* <h4>{viewLog.brandName}</h4>
    //                             <p>{viewLog.productName}</p> */}
    //                             <h4>{(viewLog.brandName || 'TOUT LIP').toUpperCase()}</h4>
    //                             <p>{viewLog.colorName || viewLog.productName || 'Custom Shade'}</p>
    //                         </div>

    //                         {/* 📍 삭제 버튼 추가: 기존 SAVE IMAGE 버튼과 나란히 혹은 아래에 배치 */}


    //                         <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

    //                             <button 
    //                                 className="delete-btn"
    //                                 onClick={() => handleDeleteWithConfirm(viewLog.logId)}
    //                                 style={{
    //                                     // 📍 '신중함'을 주는 디자인: 배경색 없이 테두리만 두어 '조심스러운' 느낌 강조
    //                                     background: 'transparent',
    //                                     border: '1.5px solid #ff4d4f',
    //                                     color: '#ff4d4f',
    //                                     /* 📍 [핀셋 추가] 요청하신 사이즈와 곡률 반영 */
    //                                     padding: '10px 18px',
    //                                     borderRadius: '8px',
                                        
    //                                     /* 📍 가독성을 위한 추가 설정 */
    //                                     cursor: 'pointer',
    //                                     fontSize: '13px',
    //                                     fontWeight: '600',
    //                                     transition: 'all 0.2s'
    //                                 }}
    //                             >
    //                                 DELETE
    //                             </button>

    //                             <DownloadLink 
    //                                 href={viewLog.photoUrl} 
    //                                 download={`ToutLip_${viewLog.logId}.png`}
    //                             >
    //                                 SAVE IMAGE
    //                             </DownloadLink>

    //                         </div>
    //                     </ModalActionArea>
    //                 </DetailModalContent>
    //             </ModalOverlay>
    //         )}

    //     </ProfileContainer>
    // );


    return (
        <ProfileContainer>
            {/* 📍 [핀셋 고정 영역] 헤더와 통계 영역은 스크롤되지 않고 고정됩니다. */}
            <FixedTopArea>
                <HeaderSection>
                    <ProfileImageWrapper>
                        <img src="https://images.unsplash.com/photo-1581883556531-e5f8027f557f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=980" alt="Profile" />
                    </ProfileImageWrapper>
                    <UserName>{nickname}</UserName> 
                    <UserGrade>VVIP MEMBER</UserGrade>
                    <LogoutBtn onClick={() => { 
                        localStorage.clear(); 
                        setUserId(null); 
                        setNickname("Moana"); 
                    }}>LOGOUT</LogoutBtn>
                </HeaderSection>

                <StatsContainer>
                    <StatItem>
                        <div className="count">{myLogs.length}</div>
                        <div className="label">MY LOGS</div>
                    </StatItem>
                    <StatItem>
                        <div className="count">{myLogs.filter(log => log.isPublic).length}</div>
                        <div className="label">SHARED</div>
                    </StatItem>
                    <StatItem>
                        <div className="count">{totalLikes}</div>
                        <div className="label">FAVORITES</div>
                    </StatItem>
                </StatsContainer>
            </FixedTopArea>

            {/* 📍 [핀셋 스크롤 영역] 여기서부터 MY GALLERY 리스트가 스크롤됩니다. */}
            <ScrollableBottomArea>
                <ContentSection>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <SectionTitle style={{ margin: 0 }}><GridIcon /> MY GALLERY</SectionTitle>
                        <button 
                            onClick={() => { setIsEditMode(!isEditMode); setSelectedLogIds([]); }}
                            style={{ background: 'none', border: 'none', color: '#D1BA94', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                            {isEditMode ? 'CANCEL' : 'EDIT'}
                        </button>
                    </div>

                    {/* 📍 편집 모드 상단 바 */}
                    {isEditMode && (
                        <EditActionBar>
                            <div className="left" onClick={toggleSelectAll}>
                                <div className={`checkbox ${selectedLogIds.length === myLogs.length ? 'checked' : ''}`} />
                                <span>ALL ({selectedLogIds.length})</span>
                            </div>
                            <button className="delete-btn" onClick={handleDeleteSelected} disabled={selectedLogIds.length === 0}>
                                DELETE SELECTED
                            </button>
                        </EditActionBar>
                    )}

                    {loading ? (
                        <LoadingTextSmall>Loading your looks...</LoadingTextSmall>
                    ) : (
                        <GalleryGrid>
                            {myLogs.map((log) => (
                                <GalleryItem 
                                    key={log.logId}
                                    $isSelected={selectedLogIds.includes(log.logId)}
                                    onClick={() => isEditMode ? toggleSelectLog(log.logId) : setViewLog(log)}
                                >
                                    <LogImage src={log.photoUrl} alt="Lip Log" />
                                    
                                    {/* 선택 모드 시 체크박스 노출 */}
                                    {isEditMode && (
                                        <div className={`select-indicator ${selectedLogIds.includes(log.logId) ? 'checked' : ''}`}>
                                            {selectedLogIds.includes(log.logId) && '✓'}
                                        </div>
                                    )}
                                    
                                    {log.isPublic && <div className="shared-badge">SHARED</div>}
                                </GalleryItem>
                            ))}
                        </GalleryGrid>
                    )}
                </ContentSection>
            </ScrollableBottomArea>

            {/* 📍 사진 상세 모달 로직 (기존과 동일) */}
            {viewLog && (
                <ModalOverlay onClick={() => setViewLog(null)}>
                    <DetailModalContent onClick={(e) => e.stopPropagation()}>
                        <CloseBtn onClick={() => setViewLog(null)}>✕</CloseBtn>
                        <DetailImage src={viewLog.photoUrl} alt="Detail View" />
                        
                        <ModalActionArea>
                            <div className="info">
                                <p style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>
                                    {new Date(viewLog.createdAt).toLocaleDateString()}
                                </p>
                                <h4>{(viewLog.brandName || 'TOUT LIP').toUpperCase()}</h4>
                                <p>{viewLog.colorName || viewLog.productName || 'Custom Shade'}</p>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button 
                                    className="delete-btn"
                                    onClick={() => handleDeleteWithConfirm(viewLog.logId)}
                                    style={{
                                        background: 'transparent',
                                        border: '1.5px solid #ff4d4f',
                                        color: '#ff4d4f',
                                        padding: '10px 18px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    DELETE
                                </button>
                                <DownloadLink 
                                    href={viewLog.photoUrl} 
                                    download={`ToutLip_${viewLog.logId}.png`}
                                >
                                    SAVE IMAGE
                                </DownloadLink>
                            </div>
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

// const ProfileContainer = styled.div`
//     padding: 40px 24px 120px 24px;
//     background-color: #000;
//     min-height: 100vh;
// `;

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

const ContentSection = styled.div` 
    margin-bottom: 30px; 
    overflow-y: auto;    
`;
const SectionTitle = styled.h3` font-size: 0.8rem; color: #FFF; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; `;

const GalleryGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 3열 유지 */
    gap: 8px; /* 간격을 좁혀서 더 세련되게 */
    padding: 0 4px;
`;

// const GalleryItem = styled.div`
//     position: relative;
//     width: 100%;
//     aspect-ratio: 1 / 1;
//     overflow: hidden;
//     border-radius: 8px;
//     background-color: #111;

//     &:hover .overlay { opacity: 1; }
// `;

// Profile.jsx 스타일 정의 부분 (Styled-components 예시)

// const GalleryItem = styled.div`
//   position: relative;
//   width: 100%;
//   aspect-ratio: 1 / 1;
//   overflow: hidden;
//   border-radius: 8px;
  
//   /* 📍 [핀셋 추가] 마우스 오버 시 손가락 모양 커서로 변경 */
//   cursor: pointer; 
  
//   /* 📍 추가 팁: 살짝 밝아지거나 확대되는 효과를 주면 더 생동감이 있어! */
//   transition: transform 0.2s ease-in-out;
  
//   &:hover {
//     transform: scale(1.02); /* 살짝 커지는 효과 */
//     filter: brightness(1.1); /* 살짝 밝아지는 효과 */
//   }
// `;

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

// Profile.jsx 하단 스타일 정의 구역에 추가
const EmptyMessage = styled.p`
    grid-column: 1 / -1;     /* 그리드 전체 칸을 차지하게 함 */
    text-align: center;
    color: #888;
    padding: 60px 0;
    font-size: 0.9rem;
    letter-spacing: 1px;
`;

const EditActionBar = styled.div`
    background: rgba(209, 186, 148, 0.1);
    border: 1px solid rgba(209, 186, 148, 0.2);
    padding: 12px 16px;
    border-radius: 12px;
    margin-bottom: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left {
        display: flex; align-items: center; gap: 8px; cursor: pointer;
        span { color: #D1BA94; font-size: 0.8rem; font-weight: 600; }
    }

    .checkbox {
        width: 18px; height: 18px; border: 1.5px solid #D1BA94; border-radius: 4px;
        &.checked { background: #D1BA94; }
    }

    .delete-btn {
        background: #ff4d4f; color: #fff; border: none; padding: 6px 12px;
        border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer;
        &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
`;

// GalleryItem 수정 (Styled-components)
const GalleryItem = styled.div`
    position: relative;
    aspect-ratio: 1 / 1;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    border: ${props => props.$isSelected ? '2.5px solid #D1BA94' : 'none'};
    transition: all 0.2s;

    .select-indicator {
        position: absolute; top: 8px; left: 8px;
        width: 20px; height: 20px; border-radius: 50%;
        background: rgba(0,0,0,0.5); border: 1.5px solid #fff;
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-size: 12px;
        &.checked { background: #D1BA94; border-color: #D1BA94; }
    }
`;

/* --- Profile.jsx 하단 스타일 정의 부분 --- */

const ProfileContainer = styled.div`
    background-color: #000;
    height: 100vh;      /* 📍 [핀셋] 화면 전체 높이를 기기에 맞춤 */
    display: flex;
    flex-direction: column;
    overflow: hidden;   /* 📍 [핀셋] 전체 스크롤을 막아 헤더 고정 효과 */
`;

const FixedTopArea = styled.div`
    flex-shrink: 0; /* 내용만큼 높이를 차지하고 줄어들지 않음 */
    z-index: 10;
    background-color: #000;
    margin-top: 48px;
`;

const ScrollableBottomArea = styled.div`
    flex: 1;            /* 남은 화면 공간을 모두 차지 */
    overflow-y: auto;

    /* 📍 [핀셋 추가] 모바일 관성 스크롤 활성화 (끊김 방지 핵심) */
    -webkit-overflow-scrolling: touch; 
    
    /* 📍 [핀셋 추가] 스크롤 애니메이션을 부드럽게 */
    scroll-behavior: smooth;

    /* 📍 [핀셋 수정] 상단 영역과의 간격 고정 */
    margin-top: 20px;   
    
    /* 📍 [핀셋 수정] 하단 잘림 방지: 탭바 높이를 고려하여 아래쪽 여백을 150px로 충분히 확보 */
    padding: 10px 24px 210px 24px;
    
    &::-webkit-scrollbar {
        display: none;  /* 깔끔한 디자인을 위해 스크롤바 숨김 */
    }
`;

export default Profile;