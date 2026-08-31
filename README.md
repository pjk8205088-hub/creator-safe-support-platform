# 인플러언서 코리아

포인트 충전으로 디지털 콘텐츠, DM 이용권, 기간형 멤버십을 구매하는 **인플러언서 코리아** 플랫폼입니다.

## 핵심 기능

- 팬/인플루언서/관리자 역할 기반 구조
- 크리에이터 공개 프로필 및 디지털 콘텐츠 패스
- 포인트 충전과 콘텐츠·DM 이용권·멤버십 구매 플로우
- 포인트 환전·양도·개인 간 전달을 제공하지 않는 디지털 상품 구조
- NICEPAY 결제 연동 준비
- 카카오 알림톡 비즈메시지 이벤트 구조
- 1:1 DM 및 스팸 방지 필터링 구조
- 멤버십 등급 및 콘텐츠 이용 리포트 구조
- 관리자 포인트 충전/디지털 상품 제공/PG 관리 대시보드
- Docker 기반 API/DB 실행 구조
- GitHub Actions CI 및 Pages 소개 사이트 배포 구조

## 현재 구조

- `apps/web`: Next.js + React 프론트엔드입니다. 마이그레이션 안정화를 위해 기존 Vite 빌드는 `build:vite`로 남겨두었습니다.
- `apps/api`: 로컬/참고용 Node API입니다. Prisma datasource는 Webtizen 환경에 맞춰 MySQL로 변경했습니다.
- `apps/webtizen`: Webtizen 공유호스팅에서 실행할 PHP + MySQL API입니다. 관리자 요약, 팬/회원 목록, 인플루언서 목록/수정, 결제내역, 수수료율 설정, 팬/인플루언서 가입, 결제 주문/승인 API를 포함합니다.
- `docs/webtizen-mysql-admin-schema.sql`: Webtizen phpMyAdmin에 import할 MySQL 테이블입니다.

## 빠른 실행

```bash
npm install
npm run dev
```

- Web: http://localhost:3000
- Vite preview: http://localhost:5173
- API: http://localhost:4000/health

## API 환경변수

`apps/api/.env.example`을 복사해서 `.env`로 사용합니다.

```bash
cp apps/api/.env.example apps/api/.env
```

## 배포

- 공개 홈페이지: https://pjk8205088-hub.github.io/creator-safe-support-platform/
- 소개/랜딩: GitHub Pages 또는 Vercel
- API: Render, Railway, Fly.io, AWS ECS 등
- DB: MySQL

## Webtizen 배포

Webtizen에는 Next.js 서버를 상시 실행하기 어렵기 때문에 프론트는 정적 파일로 export하고, 데이터 기능은 `apps/webtizen/public/api`의 PHP API가 MySQL에 저장합니다.

1. `apps/web`의 export 결과와 `apps/webtizen/public/api`, `apps/webtizen/public/config`를 홈페이지 루트에 업로드합니다.
2. `apps/webtizen/public/config/ik-mysql.example.php`를 `ik-mysql.php`로 복사한 뒤 Webtizen MySQL 정보를 입력합니다.
3. `apps/webtizen/database/webtizen-mysql-admin-schema.sql`을 phpMyAdmin에서 실행합니다.

## 현재 상태

MVP 개발이 가능한 실행형 골격입니다. GitHub Pages는 `gh-pages` 브랜치의 정적 빌드를 배포하도록 설정되어 있습니다. 실제 NICEPAY/카카오 알림톡 API 키를 넣으면 결제 승인, 알림톡 발송, 상품 제공 자동화 구현으로 확장할 수 있습니다.

## NICEPAY 준비

실제 결제를 사용하려면 NICEPAY 가맹점 신청 후 발급받은 키를 `apps/web/.env`와 `apps/api/.env`에 입력하고, 승인 콜백을 서버에서 검증한 뒤에만 포인트 충전과 디지털 상품 제공을 처리하세요.

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

## NICEPAY 심사 준비

웹앱에는 사업자정보, 이용약관, 개인정보처리방침, 취소/환불정책, 포인트 충전·디지털 상품 안내가 표시됩니다. 포인트는 현금 환전·양도·개인 간 전달 없이 사이트 안의 디지털 상품 구매에만 사용하도록 운영합니다.
