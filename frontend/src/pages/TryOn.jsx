import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import { FaceMesh } from '@mediapipe/face_mesh';
import * as cam from '@mediapipe/camera_utils';
import '../styles/css/TryOn.css';

const TryOn = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [currentBrand, setCurrentBrand] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTexture, setActiveTexture] = useState('ALL');
    const [brands, setBrands] = useState(['MAC', 'NARS']);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const faceMeshRef = useRef(null);
    const cameraRef = useRef(null);
    const selectedProductRef = useRef(null); // [핀셋 추가] 실시간 참조용
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [capturedImgForConfirm, setCapturedImgForConfirm] = useState(null);
    const [modalMessage, setModalMessage] = useState("");

    const handleSaveClick = () => {
    setIsConfirmOpen(true); // 바로 저장하지 않고 팝업을 띄움
    };

    const closeConfirmModal = () => {
        setIsConfirmOpen(false);
        setCapturedImgForConfirm(null);
    };

    const confirmSave = async () => {
        if (isSaving || !capturedImgForConfirm || !selectedProduct) return;
        setIsSaving(true);
        try {
            const response = await axios.post('http://localhost:8080/api/try-on/save', {
                userId: Number(localStorage.getItem("userId")),
                colorId: selectedProduct.id, 
                photoUrl: capturedImgForConfirm,
                isPublic: false,
                memo: `${selectedProduct.brandName || selectedProduct.brand} 시착 샷`
            });
            // alert("보관함에 저장되었습니다! ✨");
            // closeConfirmModal();
            setModalMessage("보관함에 예쁘게 저장되었습니다! ✨");
            setCapturedImgForConfirm(null); // 저장 성공 시 이미지만 제거하여 알림창으로 전환
        } catch (error) {
            // console.error("저장 실패:", error);
            // alert("저장에 실패했습니다.");
            setModalMessage("저장에 실패했습니다. 다시 시도해 주세요.");
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        selectedProductRef.current = selectedProduct;
    }, [selectedProduct]);

    // handleSave 함수 핀셋 수정
    const handleSave = async () => {
        if (isSaving) return; // [핀셋] 중복 저장 방지

        // 📍 [핵심 해결] 외부 변수(capturedImg)를 기다리지 않고, 
        // 실행 시점에 캔버스에서 직접 데이터를 만듭니다.
        if (!canvasRef.current) {
            alert("카메라 화면을 불러올 수 없습니다.");
            return;
        }
        const capturedData = canvasRef.current.toDataURL("image/png"); // 여기서 직접 추출!

        setIsSaving(true);
        try {
            const response = await axios.post('http://localhost:8080/api/liplogs', {
                userId: localStorage.getItem("userId"),
                colorId: selectedProduct?.id || 1, //
                photoUrl: capturedData,           // 📍 위에서 갓 생성한 변수를 사용합니다.
                memo: "My New Look!",
                isPublic: true
            });

            if (response.status === 201 || response.status === 200) {
                alert("갤러리에 한 장만 예쁘게 저장되었습니다! ✨");
            }
        } catch (error) {
            console.error("저장 실패:", error);
            alert("저장에 실패했습니다. 다시 시도해 주세요.");
        } finally {
            setIsSaving(false); 
        }
    };

    // [핀셋 교정] 기존의 모든 useEffect를 지우고 이 하나만 남기세요.
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const brandRes = await axios.get('http://localhost:8080/api/products/brands');
                
                console.group("🚀 [Step 1] 초기 로드 디버깅"); // 로그 그룹화
                console.log("1. 수신된 전체 브랜드 목록:", brandRes.data);

                if (brandRes.data && brandRes.data.length > 0) {
                    const extractedBrands = brandRes.data.map(b => b.name || b);
                    setBrands(extractedBrands);

                    const firstBrand = extractedBrands[0];
                    setCurrentBrand(firstBrand);
                    console.log(`2. 요청할 브랜드명: ${firstBrand}`);

                    const colorRes = await axios.get(`http://localhost:8080/api/products/colors/brand/${firstBrand}`);
                    console.log(`3. ${firstBrand} 컬러 데이터 수신 결과:`, colorRes.data);

                    if (colorRes.data && colorRes.data.length > 0) {
                        const enrichedData = colorRes.data.map(product => ({
                            ...product,
                            // 📍 [핀셋] 서버 데이터에 brandName이 없으면 현재 선택된 브랜드명을 주입
                            brandName: product.brandName || firstBrand 
                        }));
                        setProducts(colorRes.data);
                        setSelectedProduct(colorRes.data[0]);
                        console.log("✅ 데이터 로드 성공!");
                    } else {
                        console.warn("❌ 데이터는 성공적으로 호출했으나 DB가 비어있습니다 (Length 0)");
                    }
                }
                console.groupEnd();
            } catch (err) {
                console.error("❌ [에러] 서버와 연결할 수 없습니다:", err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
    if (loading) return;

    let isCancelled = false;

    // [핀셋] 1. 결과 처리 루프: 여기서 최신 selectedProductRef.current를 사용합니다.
    const onResults = (results) => {
        if (isCancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        const currentProduct = selectedProductRef.current;
        
        if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
            // [디버깅] 컬러 변경 여부 콘솔 확인
            // console.log("💄 Drawing Lips with:", currentProduct?.hexCode); 
            
            drawLips(
                ctx,
                results.multiFaceLandmarks[0],
                currentProduct?.hexCode || 'transparent',
                currentProduct?.texture || 'matte'
            );
        }
        ctx.restore();
    };

    // [핀셋] 2. 엔진 및 카메라 초기화
    const initCamera = async () => {
        try {
            // 엔진 인스턴스가 없을 때만 생성
            if (!faceMeshRef.current) {
                const faceMesh = new FaceMesh({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`
                });

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                faceMesh.onResults(onResults);
                faceMeshRef.current = faceMesh;
            }

            // [핵심] 카메라가 설정되어 있지 않다면 즉시 시작
            if (videoRef.current && !cameraRef.current) {
                // cameraRef.current = new cam.Camera(videoRef.current, {
                //     onFrame: async () => {
                //         if (faceMeshRef.current && !isCancelled) {
                //             await faceMeshRef.current.send({ image: videoRef.current });
                //         }
                //     },
                //     width: 640,
                //     height: 480,
                // });
                cameraRef.current = new cam.Camera(videoRef.current, {
                    onFrame: async () => {
                        const currentVideo = videoRef.current;
                        
                        // [핀셋 교정] 비디오가 존재하고, 화면 데이터가 준비(readyState 4)되었을 때만 전송
                        if (currentVideo && currentVideo.readyState >= 2 && faceMeshRef.current && !isCancelled) {
                            try {
                                await faceMeshRef.current.send({ image: currentVideo });
                            } catch (error) {
                                // 초기 로딩 시 발생하는 미세한 타이밍 에러 무시
                            }
                        }
                    },
                    width: 640,
                    height: 480,
                });
                console.log("📸 카메라 시작 중...");
                await cameraRef.current.start();
            }
        } catch (error) {
            console.error("카메라 초기화 에러:", error);
        }
    };

    initCamera();

    return () => {
        isCancelled = true;
        // 페이지를 벗어날 때만 확실히 멈춤
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }
    };
}, [loading]); // selectedProduct를 넣지 않아도 ref를 통해 최신값을 읽어옵니다.


    // handleCapture 함수 수정
    const handleCapture = async () => {
        const currentProduct = selectedProduct; // 현재 state 사용
        
        console.log("📸 [저장 시도] 데이터 확인:", currentProduct);

        if (!currentProduct) {
            // alert("컬러를 먼저 선택해 주세요! ✨");
            setModalMessage("컬러를 먼저 선택해 주세요! ✨"); 
            setIsConfirmOpen(true);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) {
            alert("카메라 화면을 불러올 수 없습니다.");
            return;
        }

        const imageData = canvas.toDataURL("image/png");

        setCapturedImgForConfirm(imageData);
        setIsConfirmOpen(true);

        // try {
        //     const response = await axios.post('http://localhost:8080/api/try-on/save', {
        //         userId: Number(localStorage.getItem("userId")),
        //         colorId: currentProduct.id, 
        //         photoUrl: imageData,
        //         isPublic: false,
        //         memo: `${currentProduct.brandName || currentProduct.brand} 시착 샷`
        //     });
        //     console.log("✅ 저장 성공 응답:", response.data);
        //     alert("보관함에 저장되었습니다! ✨");
        // } catch (error) {
        //     // [디버깅] 서버 에러 메시지 상세 출력
        //     console.error("❌ 저장 실패 사유:", error.response?.data || error.message);
        //     alert("저장에 실패했습니다. 콘솔을 확인해 주세요.");
        // }
    };    

    const handleSyncData = async () => {
        try {
            console.log("🚀 [Sync] 외부 API 호출 시작...");
            const externalRes = await axios.get('https://makeup-api.herokuapp.com/api/v1/products.json?product_type=lipstick');
            
            // 데이터 샘플 확인 (중요!)
            console.log("📥 [Sync] 첫 번째 데이터 샘플:", externalRes.data[0]);
            console.log("📥 [Sync] 첫 번째 데이터의 컬러칩:", externalRes.data[0].product_colors);

            console.log("📡 [Sync] 내 서버로 전송 중...");
            const response = await axios.post('http://localhost:8080/api/products/sync', externalRes.data);
            
            console.log("✅ [Sync] 서버 응답:", response.data);
            alert("동기화 프로세스가 완료되었습니다! 로그를 확인하세요.");
        } catch (err) {
            console.error("❌ [Sync] 에러 발생:", err.response?.data || err.message);
        }
    };

    // [Debug] 동기화 버튼 클릭 시 로그 확인용 핀셋 코드
    const syncDataToMyServer = async () => {
        try {
            console.log("🚀 [Debug] 외부 데이터 동기화 시작...");
            const externalRes = await axios.get('https://makeup-api.herokuapp.com/api/v1/products.json?product_type=lipstick');
            console.log("📥 [Debug] 외부 API 로드 완료 (개수):", externalRes.data.length);

            // 내 서버의 /api/products/sync 로 전송
            const response = await axios.post('http://localhost:8080/api/products/sync', externalRes.data);
            console.log("✅ [Debug] 서버 응답:", response.data);
            alert("DB 동기화 성공! ✨");
        } catch (err) {
            console.error("❌ [Debug] 동기화 실패 사유:", err.response?.data || err.message);
        }
    };

    const handleBrandChange = async (e) => {
        const brandName = e.target.value;
        setCurrentBrand(brandName);
        setActiveTexture('ALL'); 

        try {
            // [교정] 컨트롤러의 @GetMapping("/colors/brand/{brandName}") 구조와 일치시킴
            const url = `http://localhost:8080/api/products/colors/brand/${brandName}`;
            const res = await axios.get(url);
            const enrichedData = res.data.map(product => ({
                ...product,
                brandName: brandName 
            }));
            setProducts(enrichedData);
            if (enrichedData.length > 0) {
                setSelectedProduct(enrichedData[0]); // 브랜드 변경 시 첫 번째 제품 자동 선택
            }
            // setProducts(res.data);
            // if (res.data && res.data.length > 0) {
            //     setSelectedProduct(res.data[0]);
            // }
        } catch (err) {
            console.error("❌ 브랜드 변경 실패:", err);
        }
    };

    console.group("🎨 [컬러칩 출력 디버깅]");
    console.log("1. 전체 데이터 개수:", products.length);
    if (products.length > 0) {
        console.log("2. 첫 번째 데이터 hexCode 값:", products[0].hexCode);
        console.log("3. 데이터 구조 샘플:", products[0]);
    }
    console.log("4. 현재 선택된 제품:", selectedProduct?.name);
    console.groupEnd();

    if (loading) return <LoadingContainer><GoldSpinner /><p>TOUT LIP: Loading Radiance...</p></LoadingContainer>;

    return (
        <PageContainer>
            <Header>
                <h1 className="logo" style={{ cursor: 'pointer' }}>
                    TOUT LIP
                </h1>
            </Header>
            <ContentWrapper>
                <CameraSection>
                    <video ref={videoRef} style={{ display: 'none' }} muted playsInline />
                    <StyledCanvas ref={canvasRef} width={640} height={480} />
                    <LuxuryFrame />
                    <CaptureButton className="sc-dhKdcy EloMc" onClick={handleCapture}>
                        <div className="inner-dot" />
                    </CaptureButton>
                </CameraSection>

                {/* 📍 [추가 지점] CameraSection 바로 아래, ContentWrapper가 끝나기 전 */}
                {isConfirmOpen && (
                    <ModalOverlay onClick={closeConfirmModal}>
                        <ModalContent onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                {/* <h3>Save your Radiance?</h3>
                                <p>촬영한 시착 사진을 보관함에 저장하시겠습니까?</p> */}
                                {/* <h3>{capturedImgForConfirm ? "Save your Radiance?" : "TOUT LIP Notice"}</h3>
                                <p>{capturedImgForConfirm ? "촬영한 시착 사진을 보관함에 저장하시겠습니까?" : modalMessage}</p> */}
                                <h3>{capturedImgForConfirm ? "Save your Radiance?" : "TOUT LIP Notice"}</h3>
                                <p>{modalMessage || "촬영한 시착 사진을 보관함에 저장하시겠습니까?"}</p>
                            </div>

                            {/* 사진이 있을 때만 프리뷰 노출 */}
                            {capturedImgForConfirm && (
                                <div className="preview-container" style={{ position: 'relative', marginBottom: '20px' }}>
                                    <img src={capturedImgForConfirm} alt="Captured Look" style={{ width: '100%', borderRadius: '12px' }} />
                                    {/* <LuxuryFrame /> */}
                                </div>
                            )}

                            {/* <div className="modal-actions">
                                <button className="btn-cancel" onClick={closeConfirmModal} disabled={isSaving}>
                                    취소
                                </button>
                                <button className="btn-save" onClick={confirmSave} disabled={isSaving}>
                                    {isSaving ? '저장 중...' : '저장하기'}
                                </button>
                            </div> */}

                            <div className="modal-actions">
                                {capturedImgForConfirm ? (
                                    <>
                                        <button className="btn-cancel" onClick={closeConfirmModal} disabled={isSaving}>취소</button>
                                        <button className="btn-save" onClick={confirmSave} disabled={isSaving}>
                                            {isSaving ? '저장 중...' : '저장하기'}
                                        </button>
                                    </>
                                ) : (
                                    <button className="btn-save" onClick={closeConfirmModal}>확인</button>
                                )}
                            </div>
                        </ModalContent>
                    </ModalOverlay>
                )}

                <SelectionPanel>
                    {/* 1. 필터 섹션: 브랜드 선택 및 텍스처 버튼 */}
                    <FilterSection>
                        <select 
                            onChange={handleBrandChange} 
                            // 선택된 제품의 브랜드명을 대문자로 표시하여 일관성 유지
                            // value={selectedProduct?.brandName?.toUpperCase() || ''}
                            value={currentBrand}
                            style={{ 
                                minWidth: '130px', 
                                padding: '8px 12px',
                                backgroundColor: '#1e1e1e', 
                                color: '#f7e7ce', 
                                borderRadius: '20px',
                                border: '1px solid #333',
                                appearance: 'auto' 
                            }}
                        >
                            {brands.length === 0 ? (
                                <option value="">Loading...</option>
                            ) : (
                                brands.map((brand, index) => {
                                    const name = typeof brand === 'object' ? brand.name : brand;
                                    const id = typeof brand === 'object' ? brand.brandId : index;
                                    return (
                                        <option key={id} value={name}>
                                            {name}
                                        </option>
                                    );
                                })
                            )}
                        </select>

                        <TextureSlider>
                            {['ALL', 'MATTE', 'GLOSS', 'SHEER', 'VELVET'].map((type) => (
                                <TextureButton
                                    key={type}
                                    $active={activeTexture === type}
                                    onClick={() => setActiveTexture(type)}
                                >
                                    {type}
                                </TextureButton>
                            ))}
                        </TextureSlider>
                    </FilterSection>

                    {/* 2. 제품 상세 정보: 선택된 제품이 있을 때만 표시 */}
                    {selectedProduct && (
                        <ProductDetailInfo>
                            {/* <div className="info-main">
                                <h3>{selectedProduct.name}</h3>
                            </div> */}
                            <div className="info-main">
                                {/* 📍 [핀셋] 객체 구조에 따라 name 또는 colorName을 참조 */}
                                <h3>{selectedProduct.name || selectedProduct.colorName || "New Shade"}</h3>
                            </div>
                            {/* <p className="brand-name">
                                {(selectedProduct?.brandName || selectedProduct?.brand || currentBrand || 'TOUT LIP').toUpperCase()} - SELECTED LOOK
                            </p> */}
                            <p className="brand-name">
                                {(selectedProduct?.brandName || currentBrand).toUpperCase()}
                            </p>
                        </ProductDetailInfo>
                    )}

                    {/* 3. 컬러 슬라이더: 현재 불러온 products 리스트를 렌더링 */}
                    <ColorSlider>
                        {products && products.length > 0 ? (
                            (() => {
                                const filtered = products.filter(product => {
                                    if (!activeTexture || activeTexture === 'ALL') return true;
                                    const target = activeTexture.toLowerCase();
                                    const officialTexture = (product.texture || '').toLowerCase();
                                    const searchSource = `${product.name || ''} ${product.description || ''}`.toLowerCase();
                                    const isMatched = officialTexture.includes(target) || searchSource.includes(target);

                                    if (activeTexture !== 'ALL') {
                                        // console.log(`🔍 [Filter] 제품명: ${product.name} | 결과: ${isMatched ? '✅' : '❌'}`);
                                    }
                                    return isMatched;
                                });

                                // [핀셋 추가] 필터링된 결과가 0개일 때의 처리
                                if (filtered.length === 0) {
                                    return <LoadingText style={{ padding: '20px' }}>
                                        선택하신 '{activeTexture}' 제형의 컬러가 없습니다.
                                    </LoadingText>;
                                }

                                return filtered.slice(0, 20).map((product, idx) => {
                                    const colorValue = product.hexCode || (product.product_colors && product.product_colors[0]?.hex_value) || '#333';
                                    
                                    return (
                                        <ColorCard 
                                            // [핀셋 교정] Key값에 idx를 조합하여 중복 경고를 완전히 제거합니다.
                                            key={`${product.id || 'color'}-${idx}`} 
                                            onClick={() => setSelectedProduct(product)}
                                        >
                                            <ChipWrapper $color={colorValue} $active={selectedProduct?.id === product.id}>
                                                <div className="chip-inner" />
                                            </ChipWrapper>
                                        </ColorCard>
                                    );
                                });
                            })()
                        ) : (
                            <LoadingText>컬러 정보를 불러오는 중입니다...</LoadingText>
                        )}
                    </ColorSlider>
                </SelectionPanel>
            </ContentWrapper>
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

    // [핀셋 교정] 텍스처별 맞춤형 렌더링 설정
    if (texture === 'glossy') {
        ctx.globalAlpha = 0.45; // 투명하게 반짝이는 느낌
    } else if (texture === 'velvet') {
        ctx.globalAlpha = 0.75; // 보송하고 진한 발색
    } else {
        ctx.globalAlpha = 0.6;  // 기본 매트 발색
    }

    ctx.fillStyle = color;
    drawPath(UPPER_LIP);
    ctx.fill();
    drawPath(LOWER_LIP);
    ctx.fill();

    // [핵심] Glossy일 때만 입술 중앙에 샴페인 골드 하이라이트 추가
    if (texture === 'glossy') {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#F7E7CE"; 
        ctx.beginPath();
        // 아랫입술 중앙(landmarks[17]) 근처에 하이라이트 생성
        const centerX = landmarks[17].x * ctx.canvas.width;
        const centerY = landmarks[17].y * ctx.canvas.height;
        ctx.ellipse(centerX, centerY, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.globalAlpha = 1.0; // 설정 초기화
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
    //overflow: hidden; /* 내부 요소가 삐져나오지 않게 방지 */
`;

const CameraSection = styled.div`
    flex: 1.5;
    position: relative;
    background: #000;
    overflow: hidden;
    display: flex; /* 추가: 중앙 정렬을 위해 */
    justify-content: center;
    align-items: center;
    border-bottom: 2px solid ${props => props.theme.colors.borderGold};
`;

const StyledCanvas = styled.canvas`
    position: absolute; /* 요청하신 속성 추가 */
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%); /* 정확한 중앙 배치 */
    width: 100%;
    height: 100%;
    object-fit: cover; /* 영상이 왜곡되지 않고 영역을 가득 채우도록 설정 */
    z-index: 1;
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
    z-index: 10;

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
    color: ${props => props.$active ? props.theme.colors.champagneGold : '#ccc'};
    font-weight: ${props => props.$active ? '600' : '400'};
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

const ChipWrapper = styled.div.attrs(props => ({
    // [핵심] 자주 바뀌는 배경색은 클래스를 새로 만들지 않고 style 속성으로 직접 주입합니다.
    style: {
        backgroundColor: props.$color,
    },
}))`
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    /* 선택되었을 때만 이미지처럼 얇은 골드 테두리 추가 */
    border: ${props => props.$active ? '1.5px solid #D1BA94' : '1.5px solid transparent'};
    padding: 4px; /* 테두리와 안쪽 칩 사이의 여백 */

    .chip-inner {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        /* 배경색은 부모인 ChipWrapper에서 style로 이미 입혀졌으므로 여기선 효과만 줍니다. */
        // box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
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
    // padding-bottom: 5px;
    &::-webkit-scrollbar { display: none; } /* 깔끔한 UI를 위해 스크롤바 숨김 */
`;

const TextureButton = styled.button`
    background-color: ${props => props.$active ? '#333' : 'transparent'};
    color: ${props => props.$active ? '#fff' : '#666'};
    border: 1px solid ${props => props.$active ? '#333' : '#ccc'};
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
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999; /* 모든 요소보다 높게 설정 */

    height: 62px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000000; /* 배경색을 확실히 주어 뒤가 비치지 않게 함 */
    border-bottom: 1px solid ${props => props.theme.colors.borderGold};

    .logo {
        font-family: 'serif';
        font-size: 1.1rem;
        font-weight: 500;
        letter-spacing: 4px;
        // color: #FFFFFF;
        color: #D1BA94;
        margin: 0;
    }
`;

const ContentContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
`;

const ContentWrapper = styled.div`
    flex: 1;
    overflow-y: auto; /* 여기서 스크롤 발생 */
    display: flex;
    flex-direction: column;
    &::-webkit-scrollbar { display: none; } /* 스크롤바 숨김 */
`;

const LoadingText = styled.p`
    color: #D1BA94; /* 사진과 동일한 샴페인 골드 색상 */
    font-size: 0.85rem;
    letter-spacing: 1px;
    font-weight: 500;
    text-align: center;
    width: 100%;
    padding: 40px 20px;
    margin: 0;
    font-family: 'serif'; /* 로고와 통일감을 주는 세리프 스타일 */
    opacity: 0.8;
`;

const ModalOverlay = styled.div`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.8); display: flex; 
    justify-content: center; align-items: center; z-index: 9999;
`;

const ModalContent = styled.div`
    background: #121212; // 더 깊은 블랙
    padding: 30px;
    border-radius: 28px; // 카드 디자인과 일치하는 둥근 모서리
    border: 1px solid #222;
    width: 85%;
    max-width: 360px;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0,0,0,0.9), 0 0 15px rgba(209, 186, 148, 0.1);

    h3 { 
        color: #D1BA94; 
        font-family: 'serif'; 
        font-size: 1.3rem; 
        letter-spacing: 1px;
        margin-bottom: 10px; 
    }
    
    p { 
        color: #efefef; 
        font-size: 0.9rem; 
        margin-bottom: 25px; 
        line-height: 1.5;
        word-break: keep-all;
    }

    .modal-actions {
        display: flex; gap: 12px;
        button { 
            flex: 1; padding: 14px; border-radius: 14px; 
            font-size: 0.9rem; font-weight: 600; transition: all 0.2s;
        }
        .btn-save { 
            background: linear-gradient(135deg, #D1BA94 0%, #EBD8B7 100%); 
            color: #121212; border: none;
        }
        .btn-cancel { 
            background: #222; color: #888; border: 1px solid #333;
        }
    }
`;

export default TryOn;