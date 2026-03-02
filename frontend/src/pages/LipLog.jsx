import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';

const LipLog = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedImages, setSelectedImages] = useState([]); // 선택된 사진 ID들
    const [showWriteModal, setShowWriteModal] = useState(false);
    const [selectedLogs, setSelectedLogs] = useState([]); // 선택된 사진 ID 리스트 (최대 3장)
    const [postMemo, setPostMemo] = useState("");         // 공유 시 작성할 글 내용
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false); // 작성 모달 제어
    const [myGalleryLogs, setMyGalleryLogs] = useState([]); // 내 보관함 사진들
    const [selectedLogIds, setSelectedLogIds] = useState([]); // 선택된 사진 ID들
    const [isEditMode, setIsEditMode] = useState(false); // 수정 모드 여부
    const [editingPostId, setEditingPostId] = useState(null); // 수정 중인 게시글 ID
    const [publicLogs, setPublicLogs] = useState([]);
    const [activePostId, setActivePostId] = useState(null); // 현재 댓글창이 열린 게시글 ID
    const [comments, setComments] = useState({});           // 게시글별 댓글 리스트 { postId: [comments] }
    const [commentInputs, setCommentInputs] = useState({}); // { postId: "입력내용" }

    const [modalConfig, setModalConfig] = useState({ 
        isOpen: false, 
        type: 'alert', // 'alert', 'confirm', 'prompt'
        message: '', 
        onConfirm: null,
        inputValue: '' 
    });

    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const handleInputChange = (postId, value) => {
    setCommentInputs(prev => ({
        ...prev,
        [postId]: value
    }));
};

    // 📍 [핀셋] 특정 게시글의 댓글 불러오기
const fetchComments = async (postId) => {
    try {
        const res = await axios.get(`http://localhost:8080/api/comments/post/${postId}`);
        console.log("📡 [댓글 데이터 수신]:", res.data);
        console.log("👤 [내 로컬 ID]:", localStorage.getItem("userId"));

        setComments(prev => ({ ...prev, [postId]: res.data }));
        setActivePostId(activePostId === postId ? null : postId); // 토글 방식
    } catch (err) {
        console.error("댓글 로드 실패:", err);
    }
};

const handleCommentSubmit = async (postId) => {
    const userId = localStorage.getItem("userId");
    const content = commentInputs[postId]; // 해당 게시글의 입력값만 가져옴

    if (!content || !content.trim()) return;

    try {
        await axios.post(`http://localhost:8080/api/comments`, {
            userId: userId,
            postId: postId,
            content: content
        });
        
        // 제출 후 해당 게시글의 입력창만 비우기
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        fetchComments(postId); 
    } catch (err) {
        alert("댓글 등록에 실패했습니다.");
    }
};

// const handleCommentEdit = async (postId, comment) => {
//     const userId = localStorage.getItem("userId");
//     const newContent = prompt("댓글 수정:", comment.content);
    
//     if (!newContent || newContent === comment.content) return;

//     try {
//         await axios.put(`http://localhost:8080/api/comments/${comment.commentId}`, {
//             userId: userId,
//             content: newContent
//         });
//         fetchComments(postId); // 목록 새로고침
//     } catch (err) {
//         console.error("댓글 수정 실패:", err);
//         alert("수정 중 오류가 발생했습니다.");
//     }
// };

const handleCommentEdit = (postId, comment) => {
    setModalConfig({
        isOpen: true,
        type: 'prompt',
        message: "수정할 내용을 입력해 주세요. ✨",
        inputValue: comment.content,
        onConfirm: async (newContent) => {
            const userId = localStorage.getItem("userId");
            if (!newContent || newContent === comment.content) {
                closeModal();
                return;
            }
            try {
                await axios.put(`http://localhost:8080/api/comments/${comment.commentId}`, {
                    userId: userId,
                    content: newContent
                });
                fetchComments(postId);
                closeModal();
            } catch (err) {
                console.error(err);
            }
        }
    });
};


const handleCommentDelete = (postId, commentId) => {
    setModalConfig({
        isOpen: true,
        type: 'confirm',
        message: "댓글을 영구적으로 삭제하시겠습니까? 💄",
        onConfirm: async () => {
            const userId = localStorage.getItem("userId");
            try {
                await axios.delete(`http://localhost:8080/api/comments/${commentId}?userId=${userId}`);
                fetchComments(postId);
                closeModal();
            } catch (err) {
                console.error(err);
            }
        }
    });
};

const fetchAllComments = async (postId) => {
    try {
        const res = await axios.get(`http://localhost:8080/api/comments/post/${postId}`);
        // activePostId와 상관없이 각 포스트의 댓글 바구니를 채웁니다.
        setComments(prev => ({ ...prev, [postId]: res.data }));
    } catch (err) {
        console.error(`댓글 로드 실패 (Post: ${postId}):`, err);
    }
};

// 📍 [수정] 피드 작성하기 버튼 클릭 시
const handleCreateClick = () => {
    navigate('/liplog/new'); // App.js에 등록한 경로로 이동
};

// 📍 [수정] 리스트 내 수정 버튼 클릭 시
const handleEditClick = (post) => {
    // App.js에 등록한 /liplog/edit/:postId 경로로 이동
    navigate(`/liplog/edit/${post.postId}`); 
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

    // [수정] 네이버 블로그형 사진 선택/해제 로직
    // [핀셋 교정] 이 이름이 아래 333라인의 onClick과 반드시 일치해야 합니다.
const toggleSelectPhoto = (id) => {
    if (selectedLogIds.includes(id)) {
        // [해제] 선택 해제 시 해당 ID를 제거 (남은 사진들은 기존 순서 유지)
        setSelectedLogIds(prev => prev.filter(logId => logId !== id));
    } else {
        // [추가] 최대 5장 제한 및 클릭한 순서대로 배열 끝에 추가
        if (selectedLogIds.length >= 5) {
            alert("사진은 최대 5장까지만 선택 가능합니다! ✨");
            return;
        }
        setSelectedLogIds(prev => [...prev, id]);
    }
};

const handleLike = async (postId) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        alert("로그인이 필요한 서비스입니다! ✨");
        return;
    }

    const targetPost = publicLogs.find(p => p.postId === postId);
    if (!targetPost) return;
    
    const isAlreadyLiked = targetPost.liked;

    try {
        // 📍 [핀셋 수정] 서버의 toggleLike 로직 호출
        // 이제 서버가 '있으면 삭제, 없으면 추가'를 알아서 하므로 호출 주소는 동일합니다.
        await axios.patch(`http://localhost:8080/api/community/${postId}/like?userId=${userId}`);
        
        // 📍 [핀셋 업데이트] UI 즉시 반영 (Optimistic Update)
        setPublicLogs(prevLogs => prevLogs.map(post => 
            post.postId === postId 
                ? { 
                    ...post, 
                    // 이미 눌렀던 상태면 숫자 -1, 아니면 +1
                    likeCount: Math.max(0, (post.likeCount || 0) + (isAlreadyLiked ? -1 : 1)), 
                    liked: !isAlreadyLiked // 하트 색상 토글 (true <-> false)
                  } 
                : post
        ));
    } catch (error) {
        console.error("좋아요 토글 실패:", error.response?.data || error.message);
    }
};



const handleDelete = async (postId) => {
    console.log("🗑 삭제 요청 게시글 ID:", postId);
    if (!window.confirm("이 피드 게시글을 삭제하시겠습니까? (보관함 원본은 유지됩니다)")) return;
    
    try {
        console.log(`%c[피드 삭제 시도] ID: ${postId}`, "color: #f39c12;");

        // 📍 [핀셋 수정] 주소를 /api/liplogs/ 가 아니라 /api/community/ 로 변경!
        // 그래야 CommunityController.java 의 deletePost 메서드가 실행됨
        const response = await axios.delete(`http://localhost:8080/api/community/${postId}`);
        
        if (response.status === 200 || response.status === 204) {
            console.log("%c[삭제 성공] ✅ 립로그 게시글만 삭제 완료", "color: #3498db;");

            // UI 업데이트: 립로그 목록에서 제거
            setPublicLogs(prev => prev.filter(post => post.postId !== postId));
            alert("피드가 삭제되었습니다! ✨");
            
            // 📍 [선택] 최신 데이터 동기화
            fetchPublicLogs(); 
        }
    } catch (error) {
        if (error.response?.status === 404) {
        console.error("❌ 경로 오류: 서버에 /api/community/ 삭제 API가 있는지 확인하세요.");
        }
        console.error("삭제 실패 상세:", error.response?.data || error.message);
        alert("삭제 중 문제가 발생했습니다. 콘솔을 확인해 주세요.");
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
                {/* {images.map((img, idx) => (
                    <PostImage key={idx} src={img.photoUrl} alt="lip log" />
                ))} */}
                {images.map((img, idx) => (
                    <PostImage 
                        key={idx} 
                        // src={img.photoUrl || img.imageUrl || img} // 👈 이 부분을 수정하여 다양한 키 값에 대응
                        src={(img.photoUrl || img.imageUrl || img || "").toString().trim() || "/default-lip.png"}
                        alt="lip log" 
                        onError={(e) => { e.target.src = "/default-lip.png"; }}
                    />
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

const fetchPublicLogs = async () => {
    try {
        setLoading(true);
        const userId = localStorage.getItem("userId");
        const response = await axios.get(`http://localhost:8080/api/liplogs/public${userId ? `?userId=${userId}` : ''}`);

        // 1. 피드 데이터 저장
        const posts = response.data;
        setPublicLogs(posts);

        if (Array.isArray(posts)) {
            posts.forEach(post => fetchAllComments(post.postId));
        }
    } catch (error) {
        console.error("❌ 피드 로딩 실패. 서버 상태를 확인하세요:", error.response || error);
    } finally {
        setLoading(false); 
    }
};


const handlePostSubmit = async () => {
    console.log("--- 🚀 데이터 전송 시작 ---");
    console.log("전송될 최종 사진 순서(logIds):", selectedLogIds);

    if (selectedLogIds.length < 1) {
        alert("최소 1장의 사진을 선택해 주세요! ✨");
        return;
    }

    const firstLog = myGalleryLogs.find(log => log.logId === selectedLogIds[0]);

    const payload = {
        logIds: selectedLogIds, 
        memo: postMemo,
        userId: localStorage.getItem("userId"),
        brandName: firstLog?.brandName || "",
        productName: firstLog?.productName || ""
    };

    try {
        if (isEditMode) {
            console.log(`🔄 수정 요청 발송 (postId: ${editingPostId})`);
            await axios.put(`http://localhost:8080/api/liplogs/community/${editingPostId}`, payload);
            alert("피드가 수정되었습니다! ✨");
        } else {
            console.log("🆕 새 피드 등록 요청 발송");
            await axios.post('http://localhost:8080/api/liplogs/community', payload);
            alert("피드가 공유되었습니다! 🌎💄");
        }
        
        // 📍 [핀셋 수정] 작업 완료 후 모달 및 수정 모드 확실히 종료
        console.log("✨ 작업 완료 및 상태 초기화");
        
        // 1. 작성/수정 모달 닫기 (이게 빠지면 수정 후에도 모달이 남을 수 있음)
        setIsWriteModalOpen(false); 
        setShowWriteModal(false); // 기존 상태 변수도 함께 해제
        
        // 2. 수정 모드 관련 상태 초기화
        setIsEditMode(false);
        setEditingPostId(null);
        
        // 3. 입력 데이터 초기화
        setPostMemo("");
        setSelectedLogIds([]);
        
        // 4. 피드 목록 새로고침 (백엔드에서 수정된 최신 복제본 사진을 가져옴)
        fetchPublicLogs();

    } catch (err) {
        console.error("❌ 전송 실패!", err.response?.data || err.message);
        alert("전송 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
};



// [수정] 게시글 전송 로직 + 데이터 검증 로그
// const handlePostSubmit = async () => {
//     console.log("--- 🚀 데이터 전송 시작 ---");
//     console.log("전송될 최종 사진 순서(logIds):", selectedLogIds);
//     console.log("작성된 메모:", postMemo);

//     if (selectedLogIds.length < 1) {
//         alert("최소 1장의 사진을 선택해 주세요! ✨");
//         return;
//     }

//     const firstLog = myGalleryLogs.find(log => log.logId === selectedLogIds[0]);

//     const payload = {
//         logIds: selectedLogIds, 
//         memo: postMemo,
//         userId: localStorage.getItem("userId"),
//         brandName: firstLog?.brandName || "",
//         productName: firstLog?.productName || ""
//     };

//     try {
//         if (isEditMode) {
//             console.log(`🔄 수정 요청 발송 (postId: ${editingPostId})`);
//             await axios.put(`http://localhost:8080/api/liplogs/community/${editingPostId}`, payload);
//             alert("피드가 수정되었습니다! ✨");
//         } else {
//             console.log("🆕 새 피드 등록 요청 발송");
//             await axios.post('http://localhost:8080/api/liplogs/community', payload);
//             alert("피드가 공유되었습니다! 🌎💄");
//         }
        
//         // 초기화 시 로그
//         console.log("✨ 작업 완료 및 상태 초기화");
//         setIsWriteModalOpen(false);
//         setIsEditMode(false);
//         setPostMemo("");
//         setSelectedLogIds([]);
//         fetchPublicLogs();
//     } catch (err) {
//         console.error("❌ 전송 실패!", err.response?.data || err.message);
//         alert("오류가 발생했습니다.");
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
        fetchPublicLogs();
    }, []);


    if (loading) return <LoadingScreen>TOUT LIP: Loading Feed...</LoadingScreen>;

return (
    <>
        <FeedContainer>

            <HeaderArea>
                <div className="logo">TOUT LIP</div>
                <TextWriteButton onClick={handleCreateClick}>
                    피드 작성하기 ✨
                </TextWriteButton>
            </HeaderArea>

            <ScrollArea>
                <FeedList>
                    {Array.isArray(publicLogs) && publicLogs.map((post, index) => (
                        <PostCard key={post.postId || index}>
                        <PostHeader>
                            <div className="user-info">
                                {/* <UserAvatar src={post.userProfileImg || '/default-avatar.png'} /> */}
                                {/* <UserAvatar 
                                    src={post.userProfileImg ? `http://localhost:8080/uploads/${post.userProfileImg}` : '/default-avatar.png'} 
                                    alt="profile"
                                /> */}
                                
                                <UserAvatar 
                                    src={
                                        post.userProfileImg && post.userProfileImg.includes('.') 
                                            ? `http://localhost:8080/uploads/${post.userProfileImg}` 
                                            : '/default-avatar.png'
                                    } 
                                    alt="profile"
                                    onError={(e) => { 
                                        // 📍 [핀셋 수정] 무한 루프 방지: 이미 기본 이미지라면 더 이상 바꾸지 않음
                                        if (e.target.src !== window.location.origin + '/default-avatar.png') {
                                            e.target.src = '/default-avatar.png';
                                        }
                                    }}
                                />
                                <div className="text-info">
                                    <span className="nickname">{post.nickname || '모아나'}</span>
                                    <span className="date">{post.createdAt?.split('T')[0]}</span>
                                </div>
                            </div>
                            <div className="btn-group">
                                {/* 📍 수정 버튼 추가 */}
                                <EditBtn onClick={() => handleEditClick(post)}>수정</EditBtn>
                                <DeleteBtn onClick={() => handleDelete(post.postId)}>삭제</DeleteBtn>
                            </div>
                        </PostHeader>

                            <ImageSlider 
                                images={
                                    (post.images && post.images.length > 0) ? post.images : 
                                    (post.lipLogs && post.lipLogs.length > 0) ? post.lipLogs : 
                                    (post.photoUrl ? [{ photoUrl: post.photoUrl }] : [])
                                } 
                            />

                            <ActionArea>
                                <div className="icons" style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '15px', // 아이콘 사이의 여유 공간
                                    padding: '0 12px' 
                                }}>
                                    <IconButton 
                                        onClick={() => handleLike(post.postId)} 
                                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <span style={{ 
                                            fontSize: '1.2rem', 
                                            transition: 'all 0.2s ease', // 📍 부드러운 변화 효과
                                            
                                            /* 📍 [핀셋 수정] 디버깅으로 확인한 'liked' 필드를 기준으로 색상 결정 */
                                            color: post.liked ? '#ff4d4f' : '#fff',
                                            
                                            /* 📍 눌린 상태일 때 살짝 더 강조되도록 설정 */
                                            filter: post.liked ? 'drop-shadow(0 0 2px rgba(255, 77, 79, 0.5))' : 'none'
                                        }}>
                                            {post.liked ? '❤️' : '🤍'}
                                        </span>
                                        <span style={{ fontSize: '0.9rem', color: '#fff' }}>
                                            {post.likeCount || 0}
                                        </span>
                                    </IconButton>
                                    
                                    {/* <IconButton style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ fontSize: '1.2rem' }}>💬</span>
                                        <span style={{ fontSize: '0.9rem', color: '#fff' }}>댓글</span>
                                    </IconButton> */}
                                    <IconButton 
                                        onClick={() => fetchComments(post.postId)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <span style={{ fontSize: '1.2rem' }}>💬</span>
                                        <span style={{ fontSize: '0.9rem', color: '#fff' }}>
                                            {/* 📍 [핀셋] 게시글별로 저장된 댓글 개수를 실시간으로 보여줍니다. */}
                                            {comments[post.postId]?.length || 0}
                                        </span>
                                    </IconButton>
                                </div>
                            </ActionArea>
                            
                                <CommentSection>
                                    <div className="comment-list">
                                        {(comments[post.postId] || []).map((c, idx) => {
                                            // 📍 [핀셋 추가] 내 댓글인지 판단 (ID 비교)
                                            const isMyComment = String(localStorage.getItem("userId")) === String(c.userId);

                                            return (
                                                <CommentItem key={c.commentId || idx}>
                                                    <div className="comment-content">
                                                        <span className="author">{c.nickname}</span>
                                                        <span className="text">{c.content}</span>
                                                    </div>

                                                    {isMyComment && (
                                                        <div className="comment-actions">
                                                            <button className="action-btn" onClick={() => handleCommentEdit(post.postId, c)}>수정</button>
                                                            <button className="action-btn del" onClick={() => handleCommentDelete(post.postId, c.commentId)}>삭제</button>
                                                        </div>
                                                    )}
                                                </CommentItem>
                                            );
                                        })}
                                    </div>
                                    <div className="comment-input-area">
                                        <input 
                                            // 📍 [수정] newComment 대신 commentInputs[post.postId] 사용
                                            value={commentInputs[post.postId] || ""} 
                                            // 📍 [수정] setNewComment 대신 우리가 만든 handleInputChange 사용
                                            onChange={(e) => handleInputChange(post.postId, e.target.value)}
                                            placeholder="댓글을 입력하세요..." 
                                            onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(post.postId)}
                                        />
                                        <button 
                                            onClick={() => handleCommentSubmit(post.postId)}
                                            disabled={!(commentInputs[post.postId] || "").trim()}
                                        >
                                            게시
                                        </button>
                                    </div>
                                </CommentSection>

                            <PostContent>
                                <p className="description" style={{ marginTop: '0', lineHeight: '1.5' }}>
                                    <span className="bold" style={{ marginRight: '8px' }}>{post.nickname}</span>
                                    {post.memo}
                                </p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                                    <span style={{ 
                                        color: '#D1BA94', 
                                        fontSize: '0.75rem', 
                                        fontWeight: '600',
                                        background: 'rgba(209, 186, 148, 0.1)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        border: '1px solid rgba(209, 186, 148, 0.2)'
                                    }}>
                                        {/* 컬러칩 표시: hexCode 우선 참조 */}
                                        <div style={{ 
                                            width: '12px', 
                                            height: '12px', 
                                            borderRadius: '50%', 
                                            backgroundColor: post.lipLogs?.[0]?.hexCode || '#D1BA94',
                                            border: '1px solid rgba(255,255,255,0.3)'
                                        }} />
                                        
                                        <span style={{ letterSpacing: '0.5px' }}>
                                            {(post.brandName || post.lipLogs?.[0]?.brandName || 'TOUT LIP').toUpperCase()}
                                            <span style={{ color: '#fff', margin: '0 6px', opacity: 0.5 }}>|</span>
                                            
                                            {/* 📍 [핀셋] 여기도 colorName을 1순위로 가져오게 수정하여 'Bee's Knees'가 나오게 함 */}
                                            {post.lipLogs?.[0]?.colorName || post.productName || post.lipLogs?.[0]?.productName || 'Custom Look'}
                                        </span>
                                    </span>
                                </div>

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


        {isWriteModalOpen && (
            <ModalOverlay onClick={() => setIsWriteModalOpen(false)}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                    <CloseBtn onClick={() => setIsWriteModalOpen(false)}>✕</CloseBtn>
                    
                    <h2 className="modal-title">SHARE YOUR RADIANCE</h2>
                    <p className="modal-subtitle">보관함에서 빛나는 순간을 선택해 주세요 (최대 5장)</p>

                    <PhotoSelectorGrid>
                        {myGalleryLogs.map(log => {
                            const selectedIndex = selectedLogIds.indexOf(log.logId);
                            const isSelected = selectedIndex !== -1;

                            return (
                                <SelectableItem 
                                    key={log.logId} 
                                    $isSelected={isSelected}
                                    onClick={() => toggleSelectPhoto(log.logId)}
                                >
                                    {/* 📍 [핀셋 수정] 슬라이더 대신 단일 이미지 출력 */}
                                    <img src={log.photoUrl} alt="Gallery" />
                                    
                                    {isSelected && (
                                        <CheckBadge>
                                            {selectedIndex + 1}
                                        </CheckBadge>
                                    )}
                                </SelectableItem>
                            );
                        })}
                    </PhotoSelectorGrid>

                    <MemoInput 
                        value={postMemo}
                        onChange={(e) => setPostMemo(e.target.value)}
                        placeholder="입술에 담긴 당신의 이야기를 들려주세요..."
                    />
                    
                    <ModalActionRow>
                        <button 
                            className="submit-btn"
                            onClick={handlePostSubmit}
                            disabled={selectedLogIds.length < 1}
                        >
                            공유하기
                        </button>
                    </ModalActionRow>
                </ModalContent>
            </ModalOverlay>
        )}

        </FeedContainer>

        {modalConfig.isOpen && (
            <ModalOverlay onClick={closeModal}>
                <CustomModalContent onClick={(e) => e.stopPropagation()}>
                    <h3 className="modal-title">{modalConfig.type.toUpperCase()}</h3>
                    <p className="modal-message">{modalConfig.message}</p>
                    
                    {modalConfig.type === 'prompt' && (
                        <ModalInput 
                            autoFocus
                            value={modalConfig.inputValue}
                            onChange={(e) => setModalConfig({...modalConfig, inputValue: e.target.value})}
                        />
                    )}
                    
                    <div className="modal-btns">
                        {modalConfig.type !== 'alert' && (
                            <button className="sub-btn" onClick={closeModal}>CANCEL</button>
                        )}
                        <button 
                            className="main-btn" 
                            onClick={() => modalConfig.onConfirm(modalConfig.inputValue)}
                        >
                            {modalConfig.type === 'confirm' ? 'DELETE' : 'CONFIRM'}
                        </button>
                    </div>
                </CustomModalContent>
            </ModalOverlay>
        )}
    </>

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

// const ModalContent = styled.div`
//     background: #111; width: 100%; max-width: 400px; border-radius: 20px;
//     padding: 24px; border: 1px solid #222;
//     h2 { color: #fff; font-size: 1.2rem; margin-bottom: 20px; text-align: center; }
// `;

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
    position: absolute;
    top: 8px;
    right: 8px;
    background: #D1BA94; /* 뚜립 시그니처 컬러 */
    color: #000;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 800;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    z-index: 2;
`;

const SelectionOverlay = styled.div`
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(209, 186, 148, 0.2); /* 선택 시 옅은 금빛 테두리 효과 */
    border: 2px solid #D1BA94;
    pointer-events: none;
`;

// const MemoInput = styled.textarea`
//     width: 100%; height: 100px; background: #000; border: 1px solid #222;
//     color: #fff; border-radius: 12px; padding: 12px; margin-bottom: 20px;
//     resize: none; outline: none; &:focus { border-color: #D1BA94; }
// `;

const ScrollArea = styled.div`
    flex: 1;            /* 📍 남은 공간을 모두 차지 */
    width: 100%;
    overflow-y: auto;   /* 📍 드디어 여기서 스크롤이 발생합니다! */
    padding-bottom: 150px; /* 하단 탭바와 버튼 공간 확보 */
    
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

/* --- LipLog.jsx 스타일 통일 핀셋 교정 --- */

const ModalContent = styled.div`
    background: #111;
    width: 90%;
    max-width: 420px;
    border-radius: 24px; /* 📍 둥근 모서리 통일 */
    padding: 30px 24px;
    border: 1px solid #222;
    position: relative;

    .modal-title {
        color: #fff;
        font-size: 1.1rem;
        font-weight: 600;
        letter-spacing: 2px;
        margin-bottom: 8px;
        text-align: center;
    }

    .modal-subtitle {
        color: #666;
        font-size: 0.75rem;
        text-align: center;
        margin-bottom: 24px;
    }
`;

const MemoInput = styled.textarea`
    width: 100%;
    height: 100px;
    background: #000;
    border: 1.5px solid #222;
    color: #fff;
    border-radius: 14px;
    padding: 14px;
    margin-top: 20px;
    font-size: 0.9rem;
    line-height: 1.5;
    outline: none;
    resize: none;
    transition: all 0.3s;

    &:focus {
        border-color: #D1BA94;
        background: rgba(209, 186, 148, 0.05);
    }
`;

const ModalActionRow = styled.div`
    margin-top: 24px;
    display: flex;
    justify-content: center;

    .submit-btn {
        background: #D1BA94;
        color: #000;
        width: 100%;
        padding: 14px;
        border: none;
        border-radius: 14px; /* 📍 곡률 통일 */
        font-weight: 700;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s;

        &:disabled {
            background: #333;
            color: #666;
            cursor: not-allowed;
        }
    }
`;

/* CloseBtn 스타일도 Profile과 동일하게 크기 조절 */
const CloseBtn = styled.button`
    position: absolute;
    top: 20px;
    right: 20px;
    background: none;
    border: none;
    color: #555;
    font-size: 1.2rem;
    cursor: pointer;
    transition: color 0.2s;
    &:hover { color: #fff; }
`;

/* LipLog.jsx 하단 Styled Components 추가 */

const CommentSection = styled.div`
    padding: 12px 16px;
    background: #050505;
    border-top: 1px solid #1a1a1a;
    animation: fadeIn 0.3s ease;

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .comment-list {
        max-height: 150px;
        overflow-y: auto;
        margin-bottom: 12px;
        /* 스크롤바 숨기기 */
        &::-webkit-scrollbar { display: none; }
    }

    .comment-input-area {
        display: flex;
        gap: 10px;
        align-items: center;
        
        input {
            flex: 1;
            background: #111;
            border: 1px solid #222;
            color: #fff;
            padding: 8px 14px;
            border-radius: 18px;
            font-size: 0.8rem;
            outline: none;
            &:focus { border-color: #D1BA94; }
        }

        button {
            background: none;
            border: none;
            color: #D1BA94;
            font-weight: 700;
            font-size: 0.8rem;
            cursor: pointer;
            &:disabled { color: #444; cursor: default; }
        }
    }
`;

const CommentItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    font-size: 0.8rem;
    margin-bottom: 10px;
    gap: 10px;

    .comment-content { flex: 1; line-height: 1.4; }
    .author { font-weight: 700; color: #D1BA94; margin-right: 8px; }
    .text { color: #eee; word-break: break-all; }

    .comment-actions {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
    }

    .action-btn {
        background: none;
        border: none;
        color: #666;
        font-size: 0.65rem;
        cursor: pointer;
        padding: 0;
        &:hover { color: #D1BA94; }
        &.del:hover { color: #ff4d4f; }
    }
`;

const CustomModalContent = styled.div`
    background: #111;
    border: 1px solid #222;
    border-radius: 20px;
    padding: 30px;
    width: 90%;
    max-width: 340px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8);

    .modal-title { color: #D1BA94; font-size: 0.7rem; letter-spacing: 3px; margin-bottom: 15px; }
    .modal-message { color: #fff; font-size: 0.95rem; margin-bottom: 25px; line-height: 1.5; }
    
    .modal-btns { display: flex; gap: 10px; justify-content: center; }
    button {
        padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 0.8rem; cursor: pointer; border: none; flex: 1;
    }
    .main-btn { background: #D1BA94; color: #000; }
    .sub-btn { background: #222; color: #888; }
`;

const ModalInput = styled.input`
    width: 100%; background: #000; border: 1px solid #333; color: #fff;
    padding: 12px; border-radius: 10px; margin-bottom: 20px; outline: none;
    &:focus { border-color: #D1BA94; }
`;

export default LipLog;