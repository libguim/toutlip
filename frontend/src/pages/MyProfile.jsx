import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MyProfile.css';

const MyProfile = () => {
    const [myLogs, setMyLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. 유저의 로그 데이터 가져오기
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await axios.get('/api/lip-log/my'); // 본인 데이터 조회 API
                setMyLogs(response.data);
            } catch (error) {
                console.error("데이터 로딩 실패:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    // 2. 토글 변경 핸들러 (낙관적 업데이트 적용)
    const handleToggle = async (id, currentStatus) => {
        const newStatus = !currentStatus;

        // UI 우선 업데이트
        setMyLogs(prev => prev.map(log =>
            log.id === id ? { ...log, is_public: newStatus } : log
        ));

        try {
            await axios.patch(`/api/lip-log/${id}/public`, { is_public: newStatus });
        } catch (error) {
            alert("변경에 실패했습니다.");
            // 실패 시 원래 상태로 복구
            setMyLogs(prev => prev.map(log =>
                log.id === id ? { ...log, is_public: currentStatus } : log
            ));
        }
    };

    if (loading) return <div className="loading">기록을 불러오는 중...</div>;

    return (
        <div className="profile-container">
            <header className="profile-header">
                <h2>내 보관함</h2>
                <p>총 {myLogs.length}개의 기록</p>
            </header>

            {/* 갤러리 그리드 영역 */}
            <div className="gallery-grid">
                {myLogs.map((log) => (
                    <div key={log.id} className="gallery-item">
                        <img src={log.imageUrl} alt="Lip Log" className="gallery-img" />

                        {/* 공유 상태 배지 */}
                        {log.is_public && <span className="public-badge">공유 중</span>}

                        {/* 토글 스위치 오버레이 */}
                        <div className="toggle-overlay">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={log.is_public}
                                    onChange={() => handleToggle(log.id, log.is_public)}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyProfile;