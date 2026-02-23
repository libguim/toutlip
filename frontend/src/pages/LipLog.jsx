import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const LipLog = () => {
    const [publicLogs, setPublicLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImages, setSelectedImages] = useState([]); // 선택된 사진 ID들
    const [showWriteModal, setShowWriteModal] = useState(false);
    // LipLog.jsx 상단 상태 선언부에 추가
    const [selectedLogs, setSelectedLogs] = useState([]); // 선택된 사진 ID 리스트 (최대 3장)
    const [postMemo, setPostMemo] = useState("");         // 공유 시 작성할 글 내용
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false); // 작성 모달 제어
    const [myGalleryLogs, setMyGalleryLogs] = useState([]); // 내 보관함 사진들
    const [selectedLogIds, setSelectedLogIds] = useState([]); // 선택된 사진 ID들
    const [isEditMode, setIsEditMode] = useState(false); // 수정 모드 여부
    const [editingPostId, setEditingPostId] = useState(null); // 수정 중인 게시글 ID

    // 📍 수정 버튼 클릭 시 실행 (기존 작성 모달을 재활용합니다)
    const handleEditClick = (post) => {
        setEditingPostId(post.postId);
        setPostMemo(post.memo);
        // 기존에 선택된 사진 ID들을 리스트에 담아줍니다.
        setSelectedLogIds(post.lipLogs.map(log => log.logId)); 
        setIsWriteModalOpen(true);
        setIsEditMode(true); // 수정 모드 활성화
    };

    // 내 보관함 사진 불러오기 (작성 모달용)
    useEffect(() => {
        const fetchMyLogs = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                console.log("❌ userId가 로컬스토리지에 없어요!");
                return;
            }
            try {
                const res = await axios.get(`http://localhost:8080/api/liplogs/user/${userId}`);
                // 📍 여기에 찍히는 숫자가 실제 내 전체 사진 개수와 일치하는지 보세요!
                console.log("⭐ 내 갤러리 데이터 개수:", res.data.length); 
                console.log("⭐ 데이터 샘플:", res.data[0]); 
                setMyGalleryLogs(res.data);
            } catch (err) {
                console.error("보관함 로드 실패:", err);
            }
        };
        if (isWriteModalOpen) fetchMyLogs();
    }, [isWriteModalOpen]);

    // 사진 선택/해제 로직
    const toggleSelectPhoto = (id) => {
        if (selectedLogIds.includes(id)) {
            setSelectedLogIds(selectedLogIds.filter(logId => logId !== id));
        } else {
            if (selectedLogIds.length >= 5) {
                alert("사진은 최대 5장까지만 선택 가능합니다! ✨");
                return;
            }
            setSelectedLogIds([...selectedLogIds, id]);
        }
    };

    // LipLog 컴포넌트 내부
const handleLike = async (postId) => {
    try {
        // 📍 백엔드에 좋아요 요청을 보냅니다 (API 경로는 실제에 맞춰 수정 가능)
        await axios.post(`http://localhost:8080/api/posts/${postId}/like`);
        
        // 📍 성공 시 목록을 다시 불러와서 하트 수와 상태를 업데이트합니다.
        fetchPublicLogs();
    } catch (error) {
        console.error("좋아요 처리 실패:", error);
    }
};

// LipLog.jsx

const handleDelete = async (postId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    
    try {
        // 📍 [정밀 수정] 컨트롤러 주소인 /api/liplogs/${postId} 로 변경
        await axios.delete(`http://localhost:8080/api/liplogs/${postId}`);
        alert("삭제 성공! ✨");
        fetchPublicLogs();
    } catch (error) {
        // 📍 에러 상세 로그를 확인하기 위해 추가
        console.error("삭제 실패 상세:", error.response?.data || error.message);
    }
};

// LipLog.jsx 내부에 handleEdit 함수 추가
const handleEdit = async (post) => {
    const newMemo = prompt("수정할 내용을 입력하세요:", post.memo);
    if (!newMemo || newMemo === post.memo) return;

    try {
        // 📍 백엔드에 수정 요청 (postId와 새로운 메모 전송)
        await axios.put(`http://localhost:8080/api/liplogs/community/${post.postId}`, {
            memo: newMemo
        });
        alert("수정되었습니다! ✨");
        fetchPublicLogs(); // 목록 새로고침
    } catch (error) {
        console.error("수정 실패:", error);
        alert("수정에 실패했습니다.");
    }
};

// LipLog.jsx 상단 혹은 외부
const ImageSlider = ({ images }) => { // 📍 여기서 'images'를 받는지 확인!
    const [current, setCurrent] = React.useState(0);
    
    // 📍 undefined 방어를 위해 images가 있는지 먼저 체크
    if (!images || !Array.isArray(images) || images.length === 0) {
        return <PostImage src="/default-lip.png" alt="no image" />;
    }

    return (
        <SliderContainer>
            <ImageWrapper $current={current}>
                {images.map((img, idx) => (
                    <PostImage key={idx} src={img.photoUrl} alt="lip log" />
                ))}
            </ImageWrapper>
            
            {images.length > 1 && (
                <>
                    <NavBtn onClick={() => setCurrent(c => (c > 0 ? c - 1 : images.length - 1))}>❮</NavBtn>
                    <NavBtn className="right" onClick={() => setCurrent(c => (c < images.length - 1 ? c + 1 : 0))}>❯</NavBtn>
                    <DotsContainer>
                        {images.map((_, i) => <Dot key={i} $active={i === current} />)}
                    </DotsContainer>
                </>
            )}
        </SliderContainer>
    );
};

// LipLog.jsx 내부의 fetchPublicLogs 함수 수정
const fetchPublicLogs = async () => {
    try {
        setLoading(true); // 📍 로딩 시작 시 상태 true 설정
        const response = await axios.get('http://localhost:8080/api/liplogs/public');
        
        console.log("⭐ 드디어 들어온 데이터:", response.data);
        setPublicLogs(response.data);
    } catch (error) {
        console.error("❌ 피드 로딩 실패:", error);
    } finally {
        // 📍 [핵심 수정] 성공하든 실패하든 로딩 상태를 반드시 false로 바꿔야 화면이 뜹니다!
        setLoading(false); 
    }
};

    // 📍 [핀셋] 기존에 fetchPublicLogs가 useEffect 안에만 있었다면 밖으로 빼서 선언해야 합니다.
// const fetchPublicLogs = async () => {
//     try {
//         setLoading(true);
//         const response = await axios.get('http://localhost:8080/api/liplogs/public');
        
//         // 📍 [디버깅] 서버에서 넘어온 실제 데이터 구조를 확인합니다.
//         console.log("⭐ 수신된 피드 데이터:", response.data); 
        
//         setPublicLogs(response.data);
//     } catch (error) {
//         console.error("❌ 피드 로딩 상세:", error.response?.data || error.message);
//     } finally {
//         setLoading(false);
//     }
// };


const handlePostSubmit = async () => {
    if (selectedLogIds.length < 1) {
        alert("최소 1장의 사진을 선택해 주세요! ✨");
        return;
    }

    try {
        if (isEditMode) {
            // 📍 [수정 로직] PUT 요청으로 이미지와 글을 모두 보냅니다.
            await axios.put(`http://localhost:8080/api/liplogs/community/${editingPostId}`, {
                logIds: selectedLogIds,
                memo: postMemo
            });
            alert("피드가 수정되었습니다! ✨");
        } else {
            // [기존 등록 로직] POST 요청
            await axios.post('http://localhost:8080/api/liplogs/community', {
                logIds: selectedLogIds,
                memo: postMemo,
                userId: localStorage.getItem("userId")
            });
            alert("피드가 공유되었습니다! 🌎💄");
        }
        
        // 공통 마무리 로직
        setIsWriteModalOpen(false);
        setIsEditMode(false);
        setPostMemo("");
        setSelectedLogIds([]);
        fetchPublicLogs();
    } catch (err) {
        console.error("처리 실패:", err);
        alert("오류가 발생했습니다.");
    }
};

    // 📍 [핀셋] 다중 선택 피드 저장 함수 (no-undef 에러 해결본)
    // const handlePostSubmit = async () => {
    //     // 인스타그램처럼 최소 1장 조건을 걸어줍니다.
    //     if (selectedLogIds.length < 1) {
    //         alert("최소 1장의 사진을 선택해 주세요! ✨");
    //         return;
    //     }

    //     try {
    //         await axios.post('http://localhost:8080/api/liplogs/community', {
    //             logIds: selectedLogIds, // 수정된 ID 리스트 사용
    //             memo: postMemo,
    //             userId: localStorage.getItem("userId")
    //         });
            
    //         alert("소중한 립 로그가 피드에 공유되었습니다! 🌎💄");
    //         setIsWriteModalOpen(false);
    //         setPostMemo(""); 
    //         setSelectedLogIds([]); // 선택 초기화
    //         fetchPublicLogs();
    //     } catch (err) {
    //         console.error("피드 공유 실패:", err);
    //         alert("공유 중 오류가 발생했습니다.");
    //     }
    // };

    const handlePostUpload = async () => {
    if (selectedImages.length === 0 || selectedImages.length > 3) {
        alert("사진을 1~3장 선택해 주세요! ✨");
        return;
    }

    try {
        await axios.post('http://localhost:8080/api/community/post', {
            logIds: selectedImages,
            memo: postMemo,
            userId: localStorage.getItem("userId")
        });
        alert("멋진 피드가 공유되었습니다! 🌎💄");
        setShowWriteModal(false);
        fetchPublicLogs(); // 피드 새로고침
    } catch (err) {
        console.error("피드 작성 실패:", err);
    }
};



    // 1. 공개 허용된(is_public: true) 모든 유저의 로그 가져오기
    // LipLog.jsx 수정
    useEffect(() => {
        // const fetchPublicLogs = async () => {
        //     try {
        //         setLoading(true);
        //         // 📍 [핀셋] 포트 8080과 liplogs 경로를 정확히 일치시킴
        //         const response = await axios.get('http://localhost:8080/api/liplogs/public');
        //         setPublicLogs(response.data);
        //     } catch (error) {
        //         console.error("❌ 피드 로딩 실패 (서버 연결 확인):", error);
                
        //         // [참고] 에러 발생 시 더미 데이터는 유지하되 주소 수정이 우선입니다.
        //         setPublicLogs([
        //             {
        //                 id: 1,
        //                 userNickname: "jennie_kim",
        //                 userProfileImg: "https://images.unsplash.com/photo-1581883556531-e5f8027f557f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        //                 imageUrl: "https://images.unsplash.com/photo-1581883556531-e5f8027f557f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        //                 timeAgo: "2h ago",
        //                 likesCount: 1240,
        //                 caption: "Finally found my perfect red! 💋",
        //                 hexCode: "#A31D1D",
        //                 productName: "Velvet Rouge",
        //                 brandName: "CHANEL",
        //                 productCode: "CRIMSON 504"
        //             }
        //         ]);
        //     } finally {
        //         setLoading(false);
        //     }
        // };
        fetchPublicLogs();
    }, []);


    if (loading) return <LoadingScreen>TOUT LIP: Loading Feed...</LoadingScreen>;

return (
        <FeedContainer>

            <HeaderArea>
                <div className="logo">TOUT LIP</div>
                <TextWriteButton onClick={() => setIsWriteModalOpen(true)}>
                    피드 작성하기 ✨
                </TextWriteButton>
            </HeaderArea>

            <ScrollArea>
                <FeedList>
                    {Array.isArray(publicLogs) && publicLogs.map((post, index) => (
                        <PostCard key={post.postId || index}>
                        <PostHeader>
                            <div className="user-info">
                                <UserAvatar src={post.userProfileImg || '/default-avatar.png'} />
                                <div className="text-info">
                                    <span className="nickname">{post.nickname || '모아나'}</span>
                                    {/* 📍 날짜 표시 추가 (예: 2026-02-23) */}
                                    <span className="date">{post.createdAt?.split('T')[0]}</span>
                                </div>
                            </div>
                            <div className="btn-group">
                                {/* 📍 수정 버튼 추가 */}
                                <EditBtn onClick={() => handleEdit(post)}>수정</EditBtn>
                                <DeleteBtn onClick={() => handleDelete(post.postId)}>삭제</DeleteBtn>
                            </div>
                        </PostHeader>

                            {/* 📍 [차이점의 핵심] images 변수 대신 post.lipLogs를 슬라이더에 넘깁니다. */}
                            {/* <ImageSlider images={post.lipLogs} /> */}
                            <ImageSlider 
                                // 📍 [수정] lipLogs가 없으면 photoUrl을 배열로 감싸서 넘겨줍니다.
                                images={post.lipLogs && post.lipLogs.length > 0 
                                    ? post.lipLogs 
                                    : [{ photoUrl: post.photoUrl }] 
                                } 
                            />

                            <ActionArea>
                                <div className="icons">
                                    <IconButton onClick={() => handleLike(post.postId)}>
                                        {post.isLiked ? '❤️' : '🤍'} {post.likeCount || 0}
                                    </IconButton>
                                    <IconButton>💬 댓글</IconButton>
                                </div>
                            </ActionArea>

                            <PostContent>
                                <p className="description">
                                    <span className="bold">{post.nickname}</span>
                                    {post.memo}
                                </p>
                            </PostContent>
                        </PostCard>
                    ))}
                </FeedList>
            </ScrollArea>
            
            {/* 1. 우측 하단 플로팅 버튼 (프레임 안쪽 안착) */}
            <FixedActionArea>
                <FloatingWriteButton onClick={() => setIsWriteModalOpen(true)}>
                    +
                </FloatingWriteButton>
            </FixedActionArea>

            {/* 2. 작성 모달 */}
            {isWriteModalOpen && (
                <ModalOverlay>
                    <ModalContent>
                        <h2>Share Your Radiance</h2>
                        <PhotoSelectorGrid>
                            {myGalleryLogs.map(log => (
                                <SelectableItem 
                                    key={log.logId} 
                                    $isSelected={selectedLogIds.includes(log.logId)}
                                    onClick={() => toggleSelectPhoto(log.logId)}
                                >
                                    <img src={log.photoUrl} alt="Gallery" />
                                    {selectedLogIds.includes(log.logId) && (
                                        <CheckBadge>{selectedLogIds.indexOf(log.logId) + 1}</CheckBadge>
                                    )}
                                </SelectableItem>
                            ))}
                        </PhotoSelectorGrid>

                        <MemoInput 
                            value={postMemo}
                            onChange={(e) => setPostMemo(e.target.value)}
                            placeholder="글귀를 남겨보세요..."
                        />
                        
                        <div className="btn-group">
                            <button 
                                onClick={handlePostSubmit}
                                style={{ opacity: selectedLogIds.length < 1 ? 0.5 : 1 }}
                            >
                                공유하기
                            </button>
                            <button onClick={() => setIsWriteModalOpen(false)}>취소</button>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}


        </FeedContainer>
    );
};

// --- Styled Components (기존 코드 유지 및 보완) ---


const LoadingScreen = styled.div`
    height: 100vh; background: #000; color: #D1BA94;
    display: flex; justify-content: center; align-items: center;
    letter-spacing: 2px; font-weight: 300;
`;

const Header = styled.header`
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 20px; position: sticky; top: 0;
    background-color: rgba(0, 0, 0, 0.95); z-index: 100;
    .logo { font-size: 1.1rem; font-weight: 600; letter-spacing: 4px; color: #fff; margin: 0 auto; }
`;

const FeedList = styled.div` display: flex; flex-direction: column; `;

// const PostCard = styled.article` margin-bottom: 24px; border-bottom: 0.5px solid #1a1a1a; padding-bottom: 10px; `;

const UserInfo = styled.div`
    display: flex; align-items: center; padding: 12px 16px; gap: 12px;
    .user-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid #333; }
    .meta { display: flex; flex-direction: column; flex: 1;
        .username { font-size: 0.9rem; font-weight: 600; }
        .time { font-size: 0.7rem; color: #666; margin-top: 2px; }
    }
`;

// const PostImage = styled.img` width: 100%; aspect-ratio: 1 / 1.1; object-fit: cover; `;

const InteractionRow = styled.div`
    display: flex; justify-content: space-between; align-items: center; padding: 14px 16px;
    .actions { display: flex; gap: 18px; svg { cursor: pointer; stroke: #fff; } }
`;

const ContentArea = styled.div`
    padding: 0 16px;
    .likes { font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; }
    .caption { font-size: 0.85rem; line-height: 1.4; margin-bottom: 16px;
        .username { font-weight: 700; margin-right: 6px; }
        .hashtag { color: #888; margin-left: 4px; }
    }
`;

const ProductTagCard = styled.div`
    background: #111; border: 0.5px solid #222; border-radius: 10px;
    padding: 10px 14px; display: flex; align-items: center; gap: 12px;
    margin-bottom: 20px; cursor: pointer; width: fit-content;
    .chip { width: 18px; height: 18px; border-radius: 50%; background-color: ${props => props.color || '#A31D1D'}; }
    .label { font-size: 0.75rem; font-weight: 500; color: #ccc; letter-spacing: 0.5px;
        span { font-weight: 400; color: #666; margin-left: 4px; }
    }
    .arrow { color: #444; font-size: 0.8rem; }
`;

const EmptyMessage = styled.div` color: #444; text-align: center; padding: 100px 20px; `;

// --- Icons (SVG) ---
const SearchIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );
const HeartIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> );
const CommentIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg> );
const ShareIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="22" y1="2" x2="11" y2="13"></line><polyline points="22 2 15 22 11 13 2 9 22 2"></polyline></svg> );
const BookmarkIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> );
const MoreIcon = () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg> );

// LipLog.jsx 하단에 추가
const EmptyFeed = styled.div`
    text-align: center;
    padding: 100px 20px;
    color: #D1BA94;
    font-size: 0.9rem;
`;

// --- 피드 카드 기본 스타일 ---
const PostCard = styled.div`
    background: #000;
    border-bottom: 1px solid #262626;
    margin-bottom: 20px;
    width: 100%;
`;

// const PostHeader = styled.div`
//     display: flex;
//     justify-content: space-between; /* 📍 닉네임과 삭제버튼 양끝 정렬 */
//     align-items: center;
//     padding: 12px;
//     .user-info { display: flex; align-items: center; gap: 10px; }
// `;

const UserAvatar = styled.img`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
`;

const PostContent = styled.div`
    padding: 12px;
    .description { color: white; font-size: 0.9rem; }
    .bold { font-weight: 700; margin-right: 8px; }
`;

const PostImage = styled.img`
    width: 100%;
    aspect-ratio: 1 / 1; /* 📍 정사각형 비율 강제 고정 */
    object-fit: cover;   /* 📍 이미지 찌그러짐 방지 */
    display: block;
`;

const PostActions = styled.div`
    display: flex; justify-content: space-between; padding: 12px;
    color: white; font-size: 1.2rem;
    .left { display: flex; gap: 15px; }
`;



const WriteButton = styled.button`
    width: 100%; padding: 15px; background: #D1BA94; color: #000;
    border: none; border-radius: 12px; font-weight: 600; cursor: pointer;
    margin-bottom: 20px; letter-spacing: 1px;
`;

const ModalOverlay = styled.div`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.85); display: flex; align-items: center;
    justify-content: center; z-index: 1000; padding: 20px;
`;

const ModalContent = styled.div`
    background: #111; width: 100%; max-width: 400px; border-radius: 20px;
    padding: 24px; border: 1px solid #222;
    h2 { color: #fff; font-size: 1.2rem; margin-bottom: 20px; text-align: center; }
`;

const PhotoSelectorGrid = styled.div`
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
    max-height: 300px; overflow-y: auto; margin-bottom: 20px;
`;

const SelectableItem = styled.div`
    position: relative; aspect-ratio: 1/1; border-radius: 8px; overflow: hidden;
    cursor: pointer; border: 2px solid ${props => props.$isSelected ? '#D1BA94' : 'transparent'};
    img { width: 100%; height: 100%; object-fit: cover; opacity: ${props => props.$isSelected ? 0.5 : 1}; }
`;

const CheckBadge = styled.div`
    position: absolute; top: 5px; right: 5px; background: #D1BA94;
    color: #000; width: 20px; height: 20px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: bold;
`;

const MemoInput = styled.textarea`
    width: 100%; height: 100px; background: #000; border: 1px solid #222;
    color: #fff; border-radius: 12px; padding: 12px; margin-bottom: 20px;
    resize: none; outline: none; &:focus { border-color: #D1BA94; }
`;

const ScrollArea = styled.div`
    flex: 1;            /* 📍 남은 공간을 모두 차지 */
    width: 100%;
    overflow-y: auto;   /* 📍 드디어 여기서 스크롤이 발생합니다! */
    padding-bottom: 100px; /* 하단 탭바와 버튼 공간 확보 */
    
    /* 스크롤바 숨기기 (선택 사항 - 인스타 감성) */
    &::-webkit-scrollbar {
        display: none;
    }
`;
const FeedContainer = styled.div`
    background-color: #000;
    width: 100%;
    height: 100vh;      /* 📍 기기 화면 높이에 딱 맞춤 */
    position: relative; /* 버튼의 기준점 유지 */
    overflow: hidden;   /* 📍 부모 자체의 스크롤은 막아야 버튼이 고정됨 */
    display: flex;
    flex-direction: column;
`;

const FixedActionArea = styled.div`
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%; /* 📍 프레임 전체 면적 확보 */
    pointer-events: none;      /* 뒤쪽 스크롤 방해 금지 */
    z-index: 1000;
`;

const FloatingWriteButton = styled.button`
    pointer-events: auto; 
    position: absolute;
    bottom: 30px; /* 📍 디바이스 하단 탭 바 바로 위 고정 */
    right: 20px;
    width: 56px; height: 56px;
    border-radius: 50%;
    background: #D1BA94;
    font-size: 32px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    cursor: pointer;
    z-index: 1001;
`;

const DeleteBtn = styled.button`
    background: none;
    border: none;
    color: #8e8e8e;
    font-size: 0.75rem;
    cursor: pointer;
    &:hover { color: #ff4d4f; }
`;

const ActionArea = styled.div`
    padding: 10px 12px;
    display: flex;
    gap: 15px;
`;

const IconButton = styled.button`
    background: none;
    border: none;
    color: white;
    font-size: 1.1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    transition: transform 0.1s ease;

    &:active {
        transform: scale(1.2); /* 클릭 시 살짝 커지는 효과 */
    }
`;

const HeaderArea = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background-color: rgba(0, 0, 0, 0.9);
    border-bottom: 1px solid #1a1a1a;
    position: sticky;
    top: 0;
    z-index: 100;

    .logo {
        font-size: 1.1rem;
        font-weight: 600;
        letter-spacing: 2px;
        color: #D1BA94;
    }
`;

const TextWriteButton = styled.button`
    background: #D1BA94;
    color: #000;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #bfa883;
    }
`;

const SliderContainer = styled.div`
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
`;

const ImageWrapper = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    transition: transform 0.3s ease-in-out;
    transform: ${props => `translateX(-${props.$current * 100}%)`};
`;

const NavBtn = styled.button`
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.3);
    color: white;
    border: none;
    padding: 8px 12px;
    cursor: pointer;
    z-index: 10;
    border-radius: 50%;
    &.right { right: 10px; }
    &:not(.right) { left: 10px; }
`;

const DotsContainer = styled.div`
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 6px;
`;

const Dot = styled.div`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${props => props.$active ? '#D1BA94' : 'rgba(255, 255, 255, 0.5)'};
    transition: background 0.3s;
`;

const EditBtn = styled.button`
    background: none; border: none; color: #D1BA94;
    font-size: 0.75rem; cursor: pointer; margin-right: 8px;
    &:hover { text-decoration: underline; }
`;

// PostHeader 내부 스타일 보완
const PostHeader = styled.div`
    display: flex; justify-content: space-between; align-items: center; padding: 12px;
    .user-info { display: flex; align-items: center; gap: 10px; }
    .text-info { display: flex; flex-direction: column; }
    .date { font-size: 0.65rem; color: #666; margin-top: 2px; }
`;

export default LipLog;