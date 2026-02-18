import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const LipLog = () => {
    const [publicLogs, setPublicLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. 공개 허용된(is_public: true) 모든 유저의 로그 가져오기
    useEffect(() => {
        const fetchPublicLogs = async () => {
            try {
                // 실제 API 엔드포인트에 맞춰 수정하세요.
                const response = await axios.get('/api/lip-log/public');
                setPublicLogs(response.data);
            } catch (error) {
                console.error("피드 로딩 실패:", error);
                // 테스트용 더미 데이터 (데이터가 없을 때 디자인 확인용)
                setPublicLogs([
                    {
                        id: 1,
                        userNickname: "jennie_kim",
                        // userProfileImg: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=200",
                        userProfileImg: "https://images.unsplash.com/photo-1581883556531-e5f8027f557f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                        // imageUrl: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?q=80&w=800",
                        imageUrl: "https://images.unsplash.com/photo-1581883556531-e5f8027f557f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                        timeAgo: "2h ago",
                        likesCount: 1240,
                        caption: "Finally found my perfect red! 💋",
                        hexCode: "#A31D1D",
                        productName: "Velvet Rouge",
                        brandName: "CHANEL",
                        productCode: "CRIMSON 504"
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchPublicLogs();
    }, []);

    if (loading) return <LoadingScreen>TOUT LIP: Loading Feed...</LoadingScreen>;

    return (
        <FeedContainer>
            <Header>
                <div style={{ width: 24 }} />
                <h1 className="logo">TOUT LIP</h1>
                <SearchIcon />
            </Header>

            <FeedList>
                {publicLogs.length > 0 ? (
                    publicLogs.map((log) => (
                        <PostCard key={log.id}>
                            <UserInfo>
                                <img className="user-avatar" src={log.userProfileImg} alt="avatar" />
                                <div className="meta">
                                    <span className="username">{log.userNickname}</span>
                                    <span className="time">{log.timeAgo}</span>
                                </div>
                                <MoreIcon />
                            </UserInfo>

                            <PostImage src={log.imageUrl} alt="post" />

                            <InteractionRow>
                                <div className="actions">
                                    <HeartIcon />
                                    <CommentIcon />
                                    <ShareIcon />
                                </div>
                                <BookmarkIcon />
                            </InteractionRow>

                            <ContentArea>
                                <div className="likes">{log.likesCount?.toLocaleString()} likes</div>
                                <div className="caption">
                                    <span className="username">{log.userNickname}</span>
                                    {log.caption}
                                    <span className="hashtag">#ToutLip #RedLip</span>
                                </div>

                                {/* 제품 태그 카드 (이미지 포인트) */}
                                <ProductTagCard color={log.hexCode}>
                                    <div className="chip" />
                                    <div className="label">
                                        {log.productName?.toUpperCase()} · <span>{log.brandName} {log.productCode}</span>
                                    </div>
                                    <div className="arrow">〉</div>
                                </ProductTagCard>
                            </ContentArea>
                        </PostCard>
                    ))
                ) : (
                    <EmptyMessage>아직 공유된 립 로그가 없습니다.</EmptyMessage>
                )}
            </FeedList>
        </FeedContainer>
    );
};

// --- Styled Components (기존 코드 유지 및 보완) ---

const FeedContainer = styled.div`
    background-color: #000;
    min-height: 100vh;
    color: #fff;
    padding-bottom: 80px;
`;

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

const PostCard = styled.article` margin-bottom: 24px; border-bottom: 0.5px solid #1a1a1a; padding-bottom: 10px; `;

const UserInfo = styled.div`
    display: flex; align-items: center; padding: 12px 16px; gap: 12px;
    .user-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid #333; }
    .meta { display: flex; flex-direction: column; flex: 1;
        .username { font-size: 0.9rem; font-weight: 600; }
        .time { font-size: 0.7rem; color: #666; margin-top: 2px; }
    }
`;

const PostImage = styled.img` width: 100%; aspect-ratio: 1 / 1.1; object-fit: cover; `;

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

export default LipLog;