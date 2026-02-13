import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import { FaceMesh } from '@mediapipe/face_mesh';
import * as cam from '@mediapipe/camera_utils';

const TryOn = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // 1. 백엔드 데이터 로드 (Champagne Gold Loading 구현)
    useEffect(() => {
        axios.get('http://localhost:8080/api/products')
            .then(res => {
                setProducts(res.data);
                // 우아한 전환을 위해 의도적인 지연을 줍니다
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
            <CameraSection>
                <video ref={videoRef} style={{ display: 'none' }} />
                <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
                <LuxuryFrame />
            </CameraSection>

            <SelectionPanel>
                <PanelHeader>
                    <h2>Pick Your Color</h2>
                    <p>샴페인 골드빛 조명 아래 가장 완벽한 당신을 만나보세요.</p>
                </PanelHeader>

                <ColorSlider>
                    {products.map((product) => (
                        <ColorCard
                            key={product.id}
                            active={selectedProduct?.id === product.id}
                            onClick={() => setSelectedProduct(product)}
                        >
                            <ChipWrapper color={product.hexCode || '#FF0000'} active={selectedProduct?.id === product.id}>
                                <div className="chip-inner" />
                            </ChipWrapper>
                            <ProductName>{product.name}</ProductName>
                            <ProductBrand>{product.brand}</ProductBrand>
                        </ColorCard>
                    ))}
                </ColorSlider>
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
    background-color: ${props => props.theme.colors.darkBg}; height: 100vh;
    display: flex; flex-direction: column; color: ${props => props.theme.colors.softWhite};
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
  flex: 1; background: ${props => props.theme.colors.panelBg};
  border-radius: 30px 30px 0 0; padding: 20px;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
`;

const PanelHeader = styled.div`
  margin-bottom: 15px;
  h2 { font-weight: 600; font-size: 1.1rem; color: ${props => props.theme.colors.champagneGold}; }
  p { font-size: 0.75rem; color: #888; margin-top: 4px; }
`;

const ColorSlider = styled.div`
  display: flex; overflow-x: auto; gap: 18px; padding: 10px 5px;
  &::-webkit-scrollbar { display: none; }
`;

const ColorCard = styled.div`
  flex: 0 0 80px; display: flex; flex-direction: column; align-items: center;
  transition: all 0.3s ease; cursor: pointer;
  transform: ${props => props.active ? 'translateY(-8px)' : 'none'};
`;

const ChipWrapper = styled.div`
  width: 55px; height: 55px; border-radius: 50%;
  padding: 3px; background: ${props => props.active ? props.theme.colors.champagneGold : 'transparent'};
  border: 1px solid ${props => props.active ? props.theme.colors.champagneGold : '#333'};
  
  .chip-inner {
    width: 100%; height: 100%; border-radius: 50%;
    background-color: ${props => props.color};
  }
`;

const ProductName = styled.span` font-size: 0.8rem; margin-top: 8px; text-align: center; `;
const ProductBrand = styled.span` font-size: 0.65rem; color: #666; margin-top: 2px; `;

export default TryOn;