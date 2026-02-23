# 포트폴리오 개발 진행 요약 (2026-02-23)

## 1) 작업 개요
- 기준 시점: 2026-02-23 커밋/작업 내역
- 백엔드: Spring Boot + PostgreSQL
- 프론트엔드: Next.js(App Router) + React
- 목적: 프로젝트 탐색 UX 개선, 관리자 생성 플로우 추가, 인증/환경설정 정리

## 2) 주요 작업 정리

### 2-1. 홈 화면 IT 뉴스 스트립 고도화
- `yozm.wishket.com` RSS를 파싱해 홈에 노출하는 컴포넌트를 추가/개선.
- 상단 한 줄 뉴스 + 하단 미리보기 카드(데스크톱 3개/모바일 1개) 구조로 변경.
- 좌/우 이동 버튼, 현재 인덱스 표시, 발행일(월/일) 라벨 표시 지원.
- 뉴스 로딩 실패 시 예외 없이 빈 상태 UI 노출.

관련 파일
- `frontend/src/components/home-it-news-strip.tsx`
- `frontend/src/lib/tech-news.ts`
- `frontend/src/app/page.tsx`

### 2-2. 프로젝트 목록 페이지 구조 개편
- 목록 렌더링을 `ProjectsListPanel` 컴포넌트로 분리.
- 카테고리 선택 상태 표시 및 프로젝트 목록 페이징(페이지당 4개) 적용.
- 목록 상단에 관리자 진입 버튼(`추가`) 배치.

관련 파일
- `frontend/src/app/projects/page.tsx`
- `frontend/src/components/projects-list-panel.tsx`

### 2-3. 관리자 로그인/프로젝트 생성 플로우 구현
- 관리자 로그인 페이지 신규 추가.
- `Basic` 인증 헤더를 만들어 `/api/admin/projects/ping`으로 인증 확인.
- 인증 성공 시 세션 스토리지(`portfolio_admin_basic_auth`)에 저장 후 다음 경로로 이동.
- 프로젝트 작성 페이지 신규 추가(카테고리/제목/슬러그/요약/마크다운/링크 입력).
- 슬러그 자동 생성(`slugify`) 및 401/403 시 로그인 페이지로 재이동 처리.

관련 파일
- `frontend/src/app/admin/login/page.tsx`
- `frontend/src/app/projects/admin/new/page.tsx`
- `src/main/java/com/sloth/portfolio/web/AdminProjectController.java`

### 2-4. 백엔드 관리자 API 보강
- 관리자 인증 확인용 `GET /api/admin/projects/ping` 엔드포인트 추가.
- 프로젝트 생성 API의 충돌(409)/잘못된 입력(400) 예외 응답 유지.

관련 파일
- `src/main/java/com/sloth/portfolio/web/AdminProjectController.java`

### 2-5. 환경변수/설정 정리
- 서버 포트를 환경변수(`PORT`)로 오버라이드 가능하게 변경.
- 인증 쿠키/세션/코드 관련 설정 값을 전부 환경변수로 외부화.
- `.env.example`에 인증 쿠키 관련 예시 값 추가.

관련 파일
- `src/main/resources/application.yml`
- `.env.example`

### 2-6. 라우팅 실험 및 롤백
- 한때 `projects/[category]/[slug]` 상세 라우트를 도입했지만,
  같은 날짜(2026-02-23)에 롤백되어 현재는 `projects/[slug]` 단일 라우트를 유지.

관련 커밋
- 도입: `ca1c180`
- 롤백: `b8e1d0f`

## 3) 현재 상태(미커밋 변경)
- 워킹 트리 기준 수정 파일 2개:
  - `frontend/src/app/contact/page.tsx`
  - `frontend/src/app/page.tsx`
- 현재 값은 테스트성 문구(예: "테슷트", "테스트 중입니다")가 포함되어 있어,
  배포 전 실제 문구로 정리 필요.

## 4) 확인 필요 사항
- Contact 페이지의 `mailto` 링크(`your-email@example.com`)와 표시 이메일(`sloth197@naver.com`)이 다름.
- 관리자 인증 토큰을 `sessionStorage`에 보관하므로 XSS 대응(입력/렌더링 검증) 점검 필요.
- UI 기능은 확장됐지만 E2E/통합 테스트가 아직 보이지 않아, 핵심 흐름 테스트 보강 권장.

## 5) 최근 커밋 타임라인(요약)
- `7f5ed9d` chore: contact 내용 수정 + auth env 기본값 정리
- `b8e1d0f` revert: 카테고리 기반 상세 라우트 롤백
- `ca1c180` feat: 카테고리 기반 상세 라우트 추가(이후 롤백)
- `15151d2` chore: 레이아웃 푸터 문구 수정
- `98524b2` feat: 관리자 로그인 플로우 + 프로젝트 목록 페이징 레이아웃
- `585a25c` feat: 카테고리 페이지에서 관리자 생성 진입 허용
- `603f53f` feat: 홈 IT 뉴스 스트립 리디자인
- `ee5aaae` feat: 홈에 요즘IT 1줄 뉴스 스트립 추가
