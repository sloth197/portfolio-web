# Portfolio Web (SpringBoot + Next.js)

소프트웨어/펌웨어 프로젝트를 소개하고, 관리자 기능으로 프로젝트를 관리할 수 있는 개인 포트폴리오 웹 서비스입니다.

## Live
- Web: https://xhbt.dev
- API Health: https://api.xhbt.dev/api/public/health

## 관리자 계정 설정
- 관리자 로그인 계정은 코드에 하드코딩하지 않고 배포 환경변수로 관리합니다.
- 필수 환경변수: `APP_ADMIN_USERNAME`, `APP_ADMIN_PASSWORD`
- 비밀번호 길이 권장값: `APP_ADMIN_PASSWORD_MIN_LENGTH` (기본 `8`, 미달 시 경고 로그만 출력)
- 선택 환경변수(CRM 전용 계정): `APP_CRM_USERNAME`, `APP_CRM_PASSWORD`

## 주요 기능
- 프로젝트 목록/카테고리 필터/상세 조회
- 관리자 로그인 후 프로젝트 등록 및 관리
- 헤더 CRM 바로가기 링크 제공
- 라이트/다크 테마 전환
- 한/영 전환 토글 버튼

## Tech Stack
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Spring Boot (Java)
- Database: PostgreSQL
- Deploy/Infra: Vercel (Frontend), Render (Backend), Supabase (DB), Namecheap (DNS)

### 수정사항
- DB이동 (Render -> Supabase)
- Loading 및 Background화면 Animation화
- Notice 팝업 공지 추가
- 메뉴 탭 UI 개편


