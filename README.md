# Creator Safe Support Platform

Throne 스타일을 한국 시장에 맞게 재해석한 **크리에이터 안심 선물·후원 플랫폼**입니다.

## 핵심 기능

- 팬/크리에이터/관리자 역할 기반 구조
- 크리에이터 공개 프로필 및 위시리스트
- 팬 선물/후원 결제 플로우
- 주소 비공개/마스킹 설계
- 토스페이먼츠·카카오페이·PortOne 연동 준비
- 카카오 알림톡 이벤트 구조
- 관리자 주문/정산/신고 대시보드
- Docker 기반 API/DB 실행 구조
- GitHub Actions CI 및 Pages 소개 사이트 배포 구조

## 빠른 실행

```bash
npm install
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000/health

## API 환경변수

`apps/api/.env.example`을 복사해서 `.env`로 사용합니다.

```bash
cp apps/api/.env.example apps/api/.env
```

## 배포

- 소개/랜딩: GitHub Pages 또는 Vercel
- API: Render, Railway, Fly.io, AWS ECS 등
- DB: PostgreSQL

## 현재 상태

MVP 개발이 가능한 실행형 골격입니다. 실제 PG/카카오 알림톡 API 키를 넣으면 결제 승인, 알림톡 발송, 정산 자동화 구현으로 확장할 수 있습니다.


## 토스페이먼츠 준비

웹앱에는 `@tosspayments/tosspayments-sdk`가 설치되어 있습니다. 실제 결제를 사용하려면 토스페이먼츠 가맹점 신청 후 발급받은 키를 `apps/web/.env`와 `apps/api/.env`에 입력하세요. 자세한 내용은 `docs/toss-payments.md`를 확인하세요.

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```
