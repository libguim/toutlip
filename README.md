# 💄 뚜립 (Toutlip)
### AI 가상 피팅 기반 립 메이크업 큐레이션 플랫폼

> 실제 발색 확인의 어려움을 AI 기반 실시간 가상 피팅으로 해결하고,  
> Base·Point 2색 조합으로 나에게 맞는 컬러를 찾고,  
> '립 로그'로 나만의 뷰티 기록을 쌓는 큐레이션 플랫폼

**개발 기간** : 2026년 2월 | **개발 인원** : 1인 (개인 프로젝트)

🔗 [배포 링크](#) (준비 중) · [시연 영상](#) (준비 중)

<br>

## 🛠️ 기술 스택

| 구분 | 기술 |
|------|------|
| **Frontend** | React 19, React Router DOM 7, Styled Components, Axios |
| **AI / Camera** | MediaPipe Face Mesh, MediaPipe Camera Utils |
| **Backend** | Java 21, Spring Boot 3.4.1, Spring Data JPA, QueryDSL 5.0.0 |
| **Database** | MariaDB / PostgreSQL (Supabase) |
| **배포** | GitHub Pages (Frontend) |

<br>

## 🏗️ 아키텍처

```
[Browser] React 19 + MediaPipe
    │ REST API (Axios / CORS)
[Spring Boot 3.4.1] Controller → Service → Repository
    │                    │
 MariaDB           Supabase (PostgreSQL)
 (로컬 개발)        (spring.profiles.active 전환)
```

<br>

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🤖 **AI 가상 피팅** | `@mediapipe/face_mesh` 라이브러리로 얼굴 468개 랜드마크를 실시간 감지, 립 영역 좌표에 Base·Point 2가지 색상을 Canvas에 직접 오버레이. 텍스처(Matte·Gloss·Sheer·Velvet) 필터 및 브랜드별 컬러 선택 지원 |
| 🎨 **외부 API 연동** | [Makeup API](https://makeup-api.herokuapp.com)에서 립스틱 데이터를 가져와 브랜드·제품·컬러 계층 구조로 DB에 저장(`POST /api/products/sync`). 제품명·설명에서 텍스처 자동 분류 및 Hex Code 정제 처리 |
| 📔 **립 로그** | 가상 피팅 후 마음에 드는 조합을 사진과 메모로 저장. 내 보관함에서 목록 조회·삭제, 피드에 공유 가능 |
| 🌐 **피드 / 커뮤니티** | 공개 립 로그 피드 조회, 퍼스널 컬러별 피드 필터링, 좋아요·조회수, 댓글 작성·수정·삭제 |
| 👤 **회원** | 회원가입·로그인·로그아웃, 세션 기반 인증, 내 립 로그 관리 |

<br>


## ⚙️ 설치 및 실행 방법

### 사전 요구사항
- Java 21 이상
- Node.js 18 이상
- MariaDB 설치 및 실행 중 (또는 Supabase/PostgreSQL)

---

### Backend

#### 1. 데이터베이스 생성 ⚠️ 필수 선행 작업

```sql
CREATE DATABASE lipdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lipuser'@'localhost' IDENTIFIED BY '1234';
GRANT ALL PRIVILEGES ON lipdb.* TO 'lipuser'@'localhost';
FLUSH PRIVILEGES;
```

> 접속 정보가 프로젝트에 설정되어 있어 별도 수정 없이 자동 연결됩니다.

#### 2. 레포지토리 클론

```bash
git clone https://github.com/YOUR_USERNAME/toutlip.git
cd toutlip
```

#### 3. 백엔드 실행

```bash
./gradlew bootRun
```

> 접속: `http://localhost:8080`

---

### Frontend

#### 4. 환경변수 설정

`frontend/_.env.development`를 `.env.development`로 이름 변경합니다. (기본값으로 바로 사용 가능)

```env
REACT_APP_API_URL=http://localhost:8080
```

#### 5. 의존성 설치 및 실행

```bash
cd frontend
npm install
npm start
```

> 접속: `http://localhost:3000`
