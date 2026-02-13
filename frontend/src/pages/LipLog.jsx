import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/css/LipLog.css';

const LipLog = () => {
    const [publicLogs, setPublicLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPublicLogs = async () => {
            try {
                // 모든 사용자의 is_public = true인 데이터만 가져오는 API
                const response = await axios.get('/api/lip-log/public');
                setPublicLogs(response.data);
            } catch (error) {
                console.error("공유 피드를 불러오는 데 실패했습니다:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPublicLogs();
    }, []);

    if (loading) return <div className="loading">전 세계의 립 로그를 불러오는 중...</div>;

    return (
        <div className="liplog-container">
            <header className="liplog-header">
                <h1>LipLog Feed</h1>
                <p>다른 사용자들의 스타일을 확인해보세요</p>
            </header>

            <div className="liplog-feed">
                {publicLogs.length > 0 ? (
                    publicLogs.map((log) => (
                        <div key={log.id} className="liplog-card">
                            <div className="card-header">
                                <span className="user-nickname">{log.userNickname || '익명의 모아나'}</span>
                            </div>
                            <div className="card-image-wrapper">
                                <img src={log.imageUrl} alt="Shared Lip Style" className="card-img" />
                            </div>
                            <div className="card-footer">
                                <p className="card-date">{new Date(log.createdAt).toLocaleDateString()}</p>
                                {/* 여기에 좋아요(Like) 버튼 등을 추가할 수 있습니다 */}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-data">아직 공유된 로그가 없어요. 첫 번째 주인공이 되어보세요!</div>
                )}
            </div>
        </div>
    );
};

export default LipLog;