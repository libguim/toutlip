import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

const PostForm = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!postId;

    const [memo, setMemo] = useState("");
    const [selectedLogIds, setSelectedLogIds] = useState([]); // 선택된 ID 순서
    const [previewUrls, setPreviewUrls] = useState([]); // 상단 슬라이드용 URL
    const [myGalleryLogs, setMyGalleryLogs] = useState([]); // 하단 고정 갤러리 목록
    const [currentSlide, setCurrentSlide] = useState(0);

    // 📍 1. 초기 데이터 로딩 (보관함 + 수정 데이터 불러오기)
// PostForm.jsx 내 useEffect 부분 교체
useEffect(() => {
    const userId = localStorage.getItem("userId");
    
    // 1. 내 보관함 데이터 확인
    axios.get(`http://localhost:8080/api/liplogs/user/${userId}`)
        .then(res => {
            console.log("=== 🏠 1. 내 보관함 데이터 로드 ===");
            if (res.data.length > 0) {
                console.log("보관함 첫 번째 사진 ID:", res.data[0].logId, " (타입:", typeof res.data[0].logId, ")");
            }
            setMyGalleryLogs(res.data);
        })
        .catch(err => console.error("보관함 로드 실패", err));

    // 2. 수정 게시글 데이터 확인
    if (isEditMode && postId) {
        axios.get(`http://localhost:8080/api/liplogs/community/${postId}`)
            .then(res => {
                console.log("=== 📝 2. 수정 대상 게시글 데이터 로드 ===");
                console.log("서버 응답 원본:", res.data);
                
                const { memo, lipLogs } = res.data;
                setMemo(memo || "");
                
                if (lipLogs && lipLogs.length > 0) {
                    console.log("게시글 내 사진 객체 샘플:", lipLogs[0]);
                    
                    // 📍 ID 매핑 과정 로그 출력
                    const originalIds = lipLogs.map(log => {
                        const targetId = log.originalLogId || log.logId;
                        console.log(`ID 추출 중: originalLogId(${log.originalLogId}) | logId(${log.logId}) -> 최종선택: ${targetId}`);
                        return Number(targetId);
                    });
                    
                    console.log("=> 💡 최종 세팅될 selectedLogIds:", originalIds);
                    
                    setSelectedLogIds(originalIds); 
                    setPreviewUrls(lipLogs.map(log => log.photoUrl));
                }
            })
            .catch(err => {
                console.error("기존 게시글 로드 실패", err);
                alert("데이터를 불러오는 중 오류가 발생했습니다.");
            });
    }
}, [postId, isEditMode]);

    // 📍 2. 사진 선택 로직 (클릭 시 상단 슬라이드에 즉시 반영)
const handleSelectPhoto = (log) => {

    if (log.isPublic && !selectedLogIds.includes(log.logId)) {
        alert("이 사진은 이미 다른 피드에 공유되었습니다. ✨ 한 장의 사진은 하나의 피드에만 소중하게 담아주세요!");
        return;
    }

    if (selectedLogIds.includes(log.logId)) {
        // 📍 이미 선택된 경우 제거 (토글 방식)
        const indexToRemove = selectedLogIds.indexOf(log.logId);
        setSelectedLogIds(selectedLogIds.filter(id => id !== log.logId));
        setPreviewUrls(previewUrls.filter((_, i) => i !== indexToRemove));
        
        // 삭제 후 슬라이드 위치 조정
        if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
    } else {
        // 📍 새 사진 추가 (최대 5장 제한)
        if (selectedLogIds.length >= 5) return alert("최대 5장까지 선택 가능합니다.");
        setSelectedLogIds([...selectedLogIds, log.logId]);
        setPreviewUrls([...previewUrls, log.photoUrl]);
        setCurrentSlide(selectedLogIds.length); 
    }
};
// const handleSelectPhoto = (log) => {
//         if (selectedLogIds.includes(log.logId)) {
//             // 이미 선택된 사진을 다시 누르면 삭제 (교체 과정)
//             const indexToRemove = selectedLogIds.indexOf(log.logId);
//             setSelectedLogIds(selectedLogIds.filter(id => id !== log.logId));
//             setPreviewUrls(previewUrls.filter((_, i) => i !== indexToRemove));
            
//             // 삭제 후 슬라이드 위치 조정
//             if (currentSlide >= selectedLogIds.length - 1 && currentSlide > 0) {
//                 setCurrentSlide(currentSlide - 1);
//             }
//         } else {
//             // 새 사진 추가 (교체 시 이전 사진 삭제 후 클릭하면 교체됨)
//             if (selectedLogIds.length >= 5) return alert("최대 5장까지만 선택할 수 있어요! ✨");
            
//             setSelectedLogIds([...selectedLogIds, log.logId]);
//             setPreviewUrls([...previewUrls, log.photoUrl]);
//             setCurrentSlide(selectedLogIds.length); // 새 사진으로 즉시 슬라이드 이동
//         }
//     };

// PostForm.jsx 내 handleSave 함수 핀셋 수정
const handleSave = async () => {
    if (selectedLogIds.length === 0) return alert("사진을 선택해주세요!");
    
    // 📍 [핀셋 수정] 백엔드 DTO 구조에 맞춰 userId와 필드명 보강
    const cleanLogIds = selectedLogIds.filter(id => id !== null && id !== undefined);
    const dto = { 
        logIds: selectedLogIds, 
        memo: memo,
        userId: localStorage.getItem("userId") // 👈 userId 누락 방지
    };
    
    try {
        if (isEditMode) {
            // 📍 경로 확인: /api/liplogs/community/${postId}
            await axios.put(`http://localhost:8080/api/liplogs/community/${postId}`, dto);
        } else {
            await axios.post('http://localhost:8080/api/liplogs/community', dto);
        }
        navigate('/liplog'); 
    } catch (err) {
        console.error("저장 실패:", err.response?.data); // 상세 에러 로그 확인용
        alert("저장에 실패했습니다.");
    }
};


return (
    <Container>
        {/* 상단 헤더 */}
        <Header>
            <button onClick={() => navigate(-1)} className="back-btn">〈</button>
            <span className="title">{isEditMode ? '게시물 수정' : '새 게시물'}</span>
            <button onClick={handleSave} className="submit-btn">{isEditMode ? '저장' : '공유'}</button>
        </Header>

        <MainContent>
            {/* 1. 이미지 영역 (슬라이더 또는 안내 문구) */}
            <PreviewSection>
                {previewUrls.length > 0 ? (
                    <SliderContainer>
                        <div className="slides" style={{ 
                            display: 'flex', 
                            transition: 'transform 0.3s ease-out',
                            transform: `translateX(-${currentSlide * 100}%)`,
                            width: '100%', height: '100%' 
                        }}>
                            {previewUrls.map((url, i) => (
                                <div key={i} className="slide-item">
                                    <img src={url} alt={`preview-${i}`} />
                                    <button className="delete-badge" onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectPhoto({ logId: selectedLogIds[i], photoUrl: url });
                                    }}>✕</button>
                                </div>
                            ))}
                        </div>

                        {/* 📍 좌우 이동 버튼 추가 (사진이 2장 이상일 때만 표시) */}
                        {previewUrls.length > 1 && (
                            <>
                                <button 
                                    className="nav-btn prev" 
                                    onClick={() => setCurrentSlide(prev => (prev > 0 ? prev - 1 : prev))}
                                    style={{ display: currentSlide === 0 ? 'none' : 'flex' }}
                                >〈</button>
                                <button 
                                    className="nav-btn next" 
                                    onClick={() => setCurrentSlide(prev => (prev < previewUrls.length - 1 ? prev + 1 : prev))}
                                    style={{ display: currentSlide === previewUrls.length - 1 ? 'none' : 'flex' }}
                                >〉</button>
                            </>
                        )}

                        {previewUrls.length > 1 && (
                            <div className="dots-container">
                                {previewUrls.map((_, i) => (
                                    <div key={i} className={`dot ${i === currentSlide ? 'active' : ''}`} />
                                ))}
                            </div>
                        )}
                    </SliderContainer>
                ) : (
                    <EmptyPreview>
                        <p>아래 갤러리에서 사진을 선택하세요</p>
                    </EmptyPreview>
                )}
            </PreviewSection>

            {/* 2. 글 작성 영역 */}
            <CaptionSection>
                <textarea 
                    value={memo} 
                    onChange={(e) => setMemo(e.target.value)} 
                    placeholder="문구 입력..." 
                />
            </CaptionSection>

            {/* 3. 하단 고정 갤러리 영역 */}
            <GallerySection>
                <div className="grid-header">보관함 사진 (최대 5장)</div>
                <div className="grid-container">
                    {myGalleryLogs.map(log => (
                        // <GridItem 
                        //     key={log.logId} 
                        //     onClick={() => handleSelectPhoto(log)}
                        //     $isSelected={selectedLogIds.includes(log.logId)}
                        // >
                        //     <img src={log.photoUrl} alt="gallery" />
                        //     {selectedLogIds.includes(log.logId) && (
                        //         <div className="badge">{selectedLogIds.indexOf(log.logId) + 1}</div>
                        //     )}
                        // </GridItem>
                        <GridItem 
                            key={log.logId} 
                            onClick={() => handleSelectPhoto(log)}
                            // $isSelected={selectedLogIds.includes(log.logId)}
                            $isSelected={selectedLogIds.includes(Number(log.logId))}
                            $isPublic={log.isPublic} // 📍 공유 상태 전달
                            style={{ opacity: log.isPublic && !selectedLogIds.includes(log.logId) ? 0.3 : 1 }} // 📍 시각적 차단
                        >
                            <img src={log.photoUrl} alt="gallery" />
                            {log.isPublic && <div className="shared-badge">공유됨</div>} {/* 📍 텍스트 안내 */}
                            {/* {selectedLogIds.includes(log.logId) && ( */}
                            {selectedLogIds.includes(Number(log.logId)) && (
                                // <div className="badge">{selectedLogIds.indexOf(log.logId) + 1}</div>
                                <div className="badge">{selectedLogIds.indexOf(Number(log.logId)) + 1}</div>
                            )}
                        </GridItem>
                    ))}
                </div>
            </GallerySection>
        </MainContent>
    </Container>
);


};



// const Container = styled.div` display: flex; flex-direction: column; height: 100vh; background: #000; color: #fff; overflow: hidden; `;
const Header = styled.header` display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 0.5px solid #262626; .back-btn { background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; } .title { font-weight: 600; } .submit-btn { background: none; border: none; color: #0095f6; font-weight: 700; font-size: 16px; cursor: pointer; } `;
// const MainContent = styled.div` flex: 1; overflow-y: auto; display: flex; flex-direction: column; padding-bottom: 80px; &::-webkit-scrollbar { display: none; } `;
const PreviewSection = styled.div` width: 100%; aspect-ratio: 1/1; background: #121212; position: relative; `;
// const SliderContainer = styled.div` width: 100%; height: 100%; overflow: hidden; .slide-item { min-width: 100%; height: 100%; position: relative; img { width: 100%; height: 100%; object-fit: cover; } } .delete-badge { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); color: #fff; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; } .dots-container { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; } .dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255, 255, 255, 0.4); &.active { background: #0095f6; } } `;
const EmptyPreview = styled.div` height: 100%; display: flex; align-items: center; justify-content: center; color: #555; font-size: 14px; `;
const CaptionSection = styled.div` padding: 12px 16px; border-bottom: 0.5px solid #262626; textarea { width: 100%; height: 80px; background: none; border: none; color: #fff; font-size: 15px; resize: none; outline: none; } `;
// const GallerySection = styled.div` .grid-header { padding: 12px 16px; font-size: 13px; font-weight: 600; color: #8e8e8e; } .grid-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5px; } `;
// const GridItem = styled.div` position: relative; aspect-ratio: 1/1; cursor: pointer; img { width: 100%; height: 100%; object-fit: cover; opacity: ${props => props.$isSelected ? 0.4 : 1}; } .badge { position: absolute; top: 6px; right: 6px; background: #0095f6; color: #fff; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; border: 1.5px solid #fff; } `;

const SliderContainer = styled.div` 
  width: 100%; 
  height: 100%; 
  overflow: hidden; 
  position: relative;

  .slides {
    display: flex;
  }

  .slide-item { 
    min-width: 100%; 
    height: 100%; 
    position: relative; 
    img { width: 100%; height: 100%; object-fit: cover; } 
  } 

  .delete-badge { 
    position: absolute; 
    top: 10px; 
    right: 10px; 
    background: rgba(0,0,0,0.5); 
    color: #fff; 
    border: none; 
    border-radius: 50%; 
    width: 24px; 
    height: 24px; 
    cursor: pointer; 
    z-index: 10;
  } 

  /* 📍 좌우 버튼 스타일 */
  .nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.3);
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    cursor: pointer;
    z-index: 20;
    &:hover { background: rgba(0, 0, 0, 0.5); }
  }
  .nav-btn.prev { left: 10px; }
  .nav-btn.next { right: 10px; }

  .dots-container { 
    position: absolute; 
    bottom: 12px; 
    left: 50%; 
    transform: translateX(-50%); 
    display: flex; 
    gap: 6px; 
    z-index: 10;
  } 
  .dot { 
    width: 6px; 
    height: 6px; 
    border-radius: 50%; 
    background: rgba(255, 255, 255, 0.4); 
    &.active { background: #0095f6; } 
  } 
`;

// PostForm.jsx 하단의 Styled Components 부분만 이 코드로 정확히 교체해 주세요.

const Container = styled.div`
  display: flex;
  flex-direction: column;
  /* 📍 100vh 대신 100%를 사용하여 모바일 브라우저 주소창 문제를 방어합니다. */
  height: 100vh;
  background: #000;
  color: #fff;
  overflow: hidden; /* 부모 컨테이너는 고정 */
  position: relative;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* 📍 이 영역 안에서만 스크롤 발생 */
  
  /* 📍 하단 네비게이션 바의 높이를 완전히 뛰어넘을 수 있도록 여백을 대폭 늘립니다. */
  padding-bottom: 160px; 

  /* 깔끔한 UI를 위해 스크롤바 숨김 유지 */
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none; 
  scrollbar-width: none;
`;

const GallerySection = styled.div`
  padding: 0 4px;
  margin-top: 20px;
  
  /* 📍 갤러리 섹션이 내부에서 잘리지 않도록 설정 */
  display: block; 
  width: 100%;

  .grid-header { 
    padding: 12px 16px; 
    font-size: 13px; 
    font-weight: 600; 
    color: #8e8e8e; 
  }

  .grid-container { 
    display: grid; 
    grid-template-columns: repeat(3, .326fr); 
    gap: 1.5px;
    /* grid가 부모의 padding-bottom 영역까지 내려갈 수 있게 합니다. */
  }
`;

// PostForm.jsx 하단 GridItem 스타일 컴포넌트 내부 교체
export const GridItem = styled.div`
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  cursor: pointer;
  background-color: #000;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    /* 📍 선택되었을 때만 밝기를 조절하거나 테두리 효과를 줄 수 있습니다. */
    opacity: ${props => props.$isSelected ? 0.6 : 1}; 
    transform: scale(1.005);
    /* 📍 선택 시 초록색 테두리 효과 추가 */
    border: ${props => props.$isSelected ? '2px solid #4CAF50' : 'none'};
    box-sizing: border-box;
  }

  /* 📍 [핵심] 초록색 숫자 배지 디자인 (네이버 스타일) */
  .badge {
    position: absolute;
    top: 8px;           /* 📍 이미지 내부 여백 */
    right: 8px;
    background: #4CAF50; /* 📍 네이버의 상징적인 초록색 */
    color: #fff;
    width: 22px;        /* 📍 번호가 잘 보일 수 있는 적절한 크기 */
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    z-index: 10;
    /* 📍 숫자가 더 도드라져 보이도록 섀도우 추가 */
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
`;

export default PostForm;