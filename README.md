# Portfolio Web (SpringBoot + Next.js)

개인 프로젝트를 소개하고, 관리자 기능으로 프로젝트, 공지, 인증 기능을 관리할 수 있는 개인 포트폴리오 웹 서비스입니다.

## Live
- Web: https://xhbt.dev
- API Health: https://portfolio-api-y5yr.onrender.com/api/public/health

## 주요 기능
- 프로젝트 목록/카테고리 필터/상세 페이지 조회
- 관리자 로그인 (Admin, ReadOnly 계정 분리)
- 관리자 로그인 후 프로젝트 등록 및 관리
  - 프로젝트 CRUD, 첨부파일 업로드
- 한/영 전환 토글 버튼
- 홈 IT 뉴스 스트립
- 공지 등록, 수정, 삭제 기능 및 고정시 팝업 기능
  - 관리자(Admin, readOnly) 로그인 후 공지 메뉴 탭 활성화

## Tech Stack
- Frontend: Next.js, React, TypeScript, CSS
- Backend: Spring Boot (Java)
- Database: PostgreSQL
- Deploy/Infra: Vercel (Frontend), Render (Backend), Supabase (DB), Namecheap (DNS)

## * READ ONLY 계정
* ReadOnly 계정은 수정 및 삭제가 불가능 합니다.
* 로그인 시 Notice, CRM 메뉴 탭이 활성화 됩니다
- ID: readadmin
- PW: readadmin

