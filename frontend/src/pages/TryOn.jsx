import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import { FaceMesh } from '@mediapipe/face_mesh';
import * as cam from '@mediapipe/camera_utils';
import '../styles/css/TryOn.css';

const TryOn = () => {
    const [products, setProducts] = useState([
        { id: 1, name: 'Velvet Rouge', brand: 'CHANEL', hexCode: '#A31D1D', texture: 'matte' },
        { id: 2, name: 'Crimson 504', brand: 'CHANEL', hexCode: '#6B1414', texture: 'velvet' },
        { id: 3, name: 'Dusty Rose', brand: 'CHANEL', hexCode: '#8E5A52', texture: 'matte' },
        { id: 4, name: 'Deep Plum', brand: 'CHANEL', hexCode: '#4E1A2D', texture: 'glossy' },
        { id: 5, name: 'Golden Olive', brand: 'CHANEL', hexCode: '#827731', texture: 'sheer' },
        { id: 6, name: 'Soft Coral', brand: 'CHANEL', hexCode: '#A65A5A', texture: 'velvet' },
        { id: 7, name: 'Classic Red', brand: 'CHANEL', hexCode: '#8B2323', texture: 'matte' },
    ]);
    const [selectedProduct, setSelectedProduct] = useState({
        id: 1,
        name: 'Velvet Rouge',
        brand: 'CHANEL',
        hexCode: '#A31D1D',
        texture: 'matte'
    });
    const [loading, setLoading] = useState(false); // 테스트를 위해 잠시 false로!

    const [activeTexture, setActiveTexture] = useState('ALL');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // const handleCapture = () => {
    //     const canvas = canvasRef.current;
    //     const image = canvas.toDataURL("image/png");
    //     const link = document.createElement('a');
    //     link.href = image;
    //     link.download = `ToutLip_${selectedProduct?.name || 'Style'}.png`;
    //     link.click();
    //     alert("당신의 빛나는 순간이 저장되었습니다! ✨");
    // };
    const handleCapture = async () => {
        const canvas = canvasRef.current;
        const imageData = canvas.toDataURL("image/png");

        try {
            // 서버에 이미지와 제품 정보를 전송하여 DB에 저장
            const response = await axios.post('/api/lip-log/save', {
                imageUrl: imageData,
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                hexCode: selectedProduct.hexCode,
                is_public: false // 초기 저장 시에는 비공개(Gallery 전용)
            });

            if (response.status === 200) {
                alert("보관함(MY GALLERY)에 소중한 순간이 저장되었습니다! ✨");
            }
        } catch (error) {
            console.error("저장 실패:", error);
            alert("저장에 실패했습니다. 다시 시도해 주세요.");
        }
    };

    // 1. 백엔드 데이터 로드 (Champagne Gold Loading 구현)
    useEffect(() => {
        axios.get('http://localhost:8080/api/products')
            .then(res => {
                setProducts(res.data);
                if (res.data.length > 0) {
                    setSelectedProduct(res.data[0]); // 이 줄을 추가하여 기본 선택값을 만듭니다.
                }
                setTimeout(() => setLoading(false), 1500);
            })
            .catch(err => {
                console.error("데이터 로드 실패:", err);
                setLoading(false);
            });
    }, []);

    // 2. MediaPipe FaceMesh 설정 및 실시간 렌더링 연결
    useEffect(() => {
        if (loading) return;

        const faceMesh = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results) => {
            const canvasCtx = canvasRef.current.getContext('2d');
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            // 카메라 영상 그리기
            canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

            // 입술 렌더링 실행
            if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
                drawLips(
                    canvasCtx,
                    results.multiFaceLandmarks[0],
                    selectedProduct?.hexCode || 'transparent',
                    selectedProduct?.texture || 'matte'
                );
            }
            canvasCtx.restore();
        });

        if (videoRef.current) {
            const camera = new cam.Camera(videoRef.current, {
                onFrame: async () => {
                    await faceMesh.send({ image: videoRef.current });
                },
                width: 640,
                height: 480,
            });
            camera.start();
        }
    }, [loading, selectedProduct]);

    if (loading) {
        return (
            <LoadingContainer>
                <GoldSpinner />
                <p>TOUT LIP: Finding your radiance...</p>
            </LoadingContainer>
        );
    }

    return (
        <PageContainer>
            <Header>
                <div style={{ width: 24 }} /> {/* 좌측 균형을 위한 빈 공간 */}
                <h1 className="logo">TOUT LIP</h1>
            </Header>
            <CameraSection>
                <video ref={videoRef} style={{ display: 'none' }} />
                <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
                <LuxuryFrame />
                <CaptureButton onClick={handleCapture}>
                    <div className="inner-dot" />
                </CaptureButton>
            </CameraSection>

            {/* SelectionPanel의 position 설정을 바꾸면 정상적으로 나타납니다 */}
            <SelectionPanel>
                <FilterSection>
                    <select className="brand-select">
                        <option>All Brands</option>
                        <option>CHANEL</option>
                        <option>DIOR</option>
                    </select>
                    <TextureSlider>
                        {['ALL', 'MATTE', 'GLOSS', 'SHEER', 'VELVET'].map((type) => (
                            <TextureButton
                                key={type}
                                active={activeTexture === type}
                                onClick={() => setActiveTexture(type)}
                            >
                                {type}
                            </TextureButton>
                        ))}
                    </TextureSlider>
                </FilterSection>

                {/* 데이터가 로드된 후 제품 정보와 컬러칩이 보이게 합니다 */}
                {selectedProduct && (
                    <>
                        <ProductDetailInfo>
                            <div className="info-main">
                                <h3>{selectedProduct.name}</h3>
                                <span className="price">₩55,000</span>
                            </div>
                            <p className="brand-name">{selectedProduct.brand} - CRIMSON 504</p>
                        </ProductDetailInfo>

                        <ColorSlider>
                            {products.map((product) => (
                                <ColorCard
                                    key={product.id}
                                    active={selectedProduct?.id === product.id}
                                    onClick={() => setSelectedProduct(product)}
                                >
                                    <ChipWrapper color={product.hexCode} active={selectedProduct?.id === product.id}>
                                        <div className="chip-inner" />
                                    </ChipWrapper>
                                </ColorCard>
                            ))}
                        </ColorSlider>
                    </>
                )}
            </SelectionPanel>
        </PageContainer>
    );
};

// --- 입술 렌더링 유틸리티 함수 (하단 배치) ---
const drawLips = (ctx, landmarks, color, texture) => {
    const UPPER_LIP = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78];
    const LOWER_LIP = [146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78];

    const drawPath = (indices) => {
        ctx.beginPath();
        indices.forEach((idx, i) => {
            const point = landmarks[idx];
            if (i === 0) ctx.moveTo(point.x * ctx.canvas.width, point.y * ctx.canvas.height);
            else ctx.lineTo(point.x * ctx.canvas.width, point.y * ctx.canvas.height);
        });
        ctx.closePath();
    };

    ctx.globalAlpha = texture === 'glossy' ? 0.4 : 0.6;
    ctx.fillStyle = color;

    drawPath(UPPER_LIP);
    ctx.fill();
    drawPath(LOWER_LIP);
    ctx.fill();

    if (texture === 'glossy') {
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = "#F7E7CE"; // 샴페인 골드 하이라이트
        ctx.beginPath();
        ctx.ellipse(landmarks[0].x * ctx.canvas.width, landmarks[0].y * ctx.canvas.height, 15, 7, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
};

// --- Styled Components (Dark & Luxury Gold) ---
const rotate = keyframes`
    from { transform: rotate(0deg); } to { transform: rotate(360deg); }
`;

const LoadingContainer = styled.div`
    height: 100vh; background: ${props => props.theme.colors.darkBg};
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    color: ${props => props.theme.colors.champagneGold};
`;

const GoldSpinner = styled.div`
    width: 45px; height: 45px; border: 3px solid rgba(247, 231, 206, 0.1);
    border-top: 3px solid ${props => props.theme.colors.champagneGold};
    border-radius: 50%; animation: ${rotate} 1.2s linear infinite;
    margin-bottom: 15px; box-shadow: ${props => props.theme.shadows.glow};
`;

const PageContainer = styled.div`
    background-color: ${props => props.theme.colors.darkBg};
    min-height: 100vh; /* height 대신 min-height 사용 */
    width: 100%;
    display: flex;
    flex-direction: column;
    color: ${props => props.theme.colors.softWhite};
    overflow: hidden; /* 내부 요소가 삐져나오지 않게 방지 */
`;

const CameraSection = styled.div`
    flex: 1.5; position: relative; background: #000; overflow: hidden;
    border-bottom: 2px solid ${props => props.theme.colors.borderGold};
`;

const LuxuryFrame = styled.div`
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  box-shadow: inset 0 0 50px rgba(183, 110, 121, 0.2); pointer-events: none;
`;

const SelectionPanel = styled.div`
    background: ${props => props.theme.colors.panelBg};
    border-radius: 30px 30px 0 0;
    padding: 24px 20px;
    flex: .5;
    display: flex;
    flex-direction: column;
    z-index: 50;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6);
    /* 아래 여백을 확실히 주어 네비바와 겹침 방지 */
    //padding-bottom: 100px;
    overflow-y: auto; /* 내용이 많으면 내부 스크롤 가능하게 */
`;

const PanelHeader = styled.div`
  margin-bottom: 15px;
  h2 { font-weight: 600; font-size: 1.1rem; color: ${props => props.theme.colors.champagneGold}; }
  p { font-size: 0.75rem; color: #888; margin-top: 4px; }
`;

const ColorSlider = styled.div`
    display: flex;
    gap: 20px;
    overflow-x: auto; /* 가로 스크롤 활성화 */
    padding: 10px 0;
    width: 100%;

    /* 스크롤바 숨기기 */
    -ms-overflow-style: none;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
`;

// const ProductName = styled.span` font-size: 0.8rem; margin-top: 8px; text-align: center; `;
const ProductBrand = styled.span` font-size: 0.65rem; color: #666; margin-top: 2px; `;

const CaptureButton = styled.button`
    position: absolute;
    bottom: 40px; /* 위치는 레이아웃에 맞게 조절하세요 */
    left: 50%;
    transform: translateX(-50%);

    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: none;
    cursor: pointer;

    /* 1. 배경: 이미지와 동일한 고급스러운 베이지/골드 그라데이션 */
    background: radial-gradient(circle at 30% 30%, #EBD8B7 0%, #D1BA94 100%);

    /* 2. 입체감: 외부 글로우와 내부 그림자를 중첩하여 버튼을 띄움 */
    box-shadow:
            0 10px 20px rgba(0, 0, 0, 0.4),            /* 하단 바닥 그림자 */
            0 0 15px rgba(209, 186, 148, 0.3),        /* 주변 은은한 광채 */
            inset 0 2px 4px rgba(255, 255, 255, 0.5),  /* 상단 하이라이트 (빛) */
            inset 0 -3px 6px rgba(0, 0, 0, 0.2);       /* 하단 깊이감 */

    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    /* 클릭 시 살짝 눌리는 효과 */
    &:active {
        transform: translateX(-50%) scale(0.95);
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.4);
    }

    /* 이미지의 중앙 검은 점 구현 */
    .inner-dot {
        width: 14px;
        height: 14px;
        background-color: #121212; /* 배경색과 동일하게 */
        border-radius: 50%;
        box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.2);
    }
`;

const ProductName = styled.span`
    font-size: 0.8rem;
    margin-top: 8px;
    text-align: center;
    color: ${props => props.active ? props.theme.colors.champagneGold : '#ccc'};
    font-weight: ${props => props.active ? '600' : '400'};
`;

const FilterSection = styled.div`
    display: flex; gap: 12px; margin-bottom: 24px;
    
    .brand-select {
        background: #1e1e1e; color: #f7e7ce; border: 1px solid #333;
        padding: 8px 12px; border-radius: 20px; font-size: 0.8rem;
    }

    .texture-groups {
        display: flex; gap: 8px;
        button {
            background: #1e1e1e; color: #666; border: none;
            padding: 8px 16px; border-radius: 20px; font-size: 0.7rem;
            &.active { background: #333; color: #f7e7ce; }
        }
    }
`;

const ProductDetailInfo = styled.div`
    margin-top: 10px; /* 필터 섹션과의 거리 */
    margin-bottom: 30px; /* 컬러칩 슬라이더와의 거리 확보 */

    .info-main {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        h3 {
            color: white;
            font-size: 1.4rem; /* 폰트 크기 살짝 키움 */
            margin: 0;
            font-weight: 500;
        }
        .price {
            color: #888;
            font-size: 0.75rem;
            border: 1px solid #333;
            padding: 4px 8px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.05);
        }
    }
    .brand-name {
        color: #D1BA94; /* 샴페인 골드 색상 적용 */
        font-size: 0.85rem;
        margin-top: 8px;
        letter-spacing: 1px;
        font-weight: 500;
    }
`;

const ChipWrapper = styled.div`
    width: 60px; /* 크기를 살짝 키움 */
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    /* 선택되었을 때만 이미지처럼 얇은 골드 테두리 추가 */
    border: ${props => props.active ? '1.5px solid #D1BA94' : '1.5px solid transparent'};
    padding: 4px; /* 테두리와 안쪽 칩 사이의 여백 */

    .chip-inner {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: ${props => props.color};
        /* 칩 자체에도 미세한 입체감 추가 */
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
    }

    /* 마우스 호버 시 효과 */
    &:hover {
        transform: scale(1.05);
    }
`;

const TextureSlider = styled.div`
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 5px;
    &::-webkit-scrollbar { display: none; } /* 깔끔한 UI를 위해 스크롤바 숨김 */
`;

const TextureButton = styled.button`
    background: #1e1e1e;
    color: ${props => props.active ? props.theme.colors.champagneGold : '#666'};
    border: 1px solid ${props => props.active ? props.theme.colors.champagneGold : '#333'};
    padding: 8px 18px;
    border-radius: 20px;
    font-size: 0.7rem;
    white-space: nowrap; /* 글자 줄바꿈 방지 */
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover { background: #2a2a2a; }
`;

const ColorCard = styled.div`
    flex: 0 0 auto; /* ★ 중요: 자식 요소가 줄어들지 않도록 설정 */
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
`;

const Header = styled.header`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 18px 20px;
    background-color: transparent; /* 카메라 영상 위에 뜰 수 있도록 투명 처리 */
    position: absolute; /* 카메라 섹션 위에 겹치게 배치 */
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;

    .logo {
        font-family: 'serif'; /* 혹은 고급스러운 명조체 계열 */
        font-size: 1.1rem;
        font-weight: 500;
        letter-spacing: 4px; /* 이미지처럼 자간을 넓게 설정 */
        color: #FFFFFF;
        margin: 0;
        text-align: center;
    }
`;


export default TryOn;