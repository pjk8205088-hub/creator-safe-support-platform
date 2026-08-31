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
- Railway 단일 배포 구조

## 현재 구조

- `apps/web`: Next.js + React 프론트엔드입니다. Railway 배포 시 `apps/web/out`으로 정적 export됩니다.
- `apps/api`: Railway에서 실행되는 Express + Prisma API입니다. MySQL `DATABASE_URL`이 있으면 관리자/회원/결제 데이터가 DB에 저장되고, API 서버가 Next 정적 프론트도 함께 서빙합니다.

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

- 운영 홈페이지/API: Railway
- 운영 도메인: `eon8.co.kr`, `www.eon8.co.kr`
- DB: MySQL

## Railway 배포

Railway 한 프로젝트 안에서 앱 서비스 1개와 MySQL 서비스 1개를 사용합니다. 앱 서비스는 빌드 시 Next.js 프론트를 export하고 Express API를 컴파일한 뒤, 실행 시 API와 홈페이지를 같은 도메인에서 제공합니다.

필수 환경변수:

- `DATABASE_URL`: Railway MySQL의 `${{MySQL.MYSQL_URL}}`
- `WEB_ORIGIN`: `https://www.eon8.co.kr,https://eon8.co.kr,https://<railway-domain>`
- `ADMIN_COMMISSION_RATE`: 기본 수수료율. 예: `25`

## 도메인 연결

Railway 배포가 성공하면 Railway 앱 서비스에 `eon8.co.kr`과 `www.eon8.co.kr`을 custom domain으로 추가하고, 도메인 DNS에서 Railway가 안내하는 `CNAME`/`TXT` 레코드를 설정합니다.

## 현재 상태

MVP 개발이 가능한 실행형 골격입니다. 운영 배포는 Railway 기준이며, 실제 NICEPAY/카카오 알림톡 API 키를 넣으면 결제 승인, 알림톡 발송, 상품 제공 자동화 구현으로 확장할 수 있습니다.

## NICEPAY 준비

실제 결제를 사용하려면 NICEPAY 가맹점 신청 후 발급받은 키를 `apps/web/.env`와 `apps/api/.env`에 입력하고, 승인 콜백을 서버에서 검증한 뒤에만 포인트 충전과 디지털 상품 제공을 처리하세요.

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

## NICEPAY 심사 준비

웹앱에는 사업자정보, 이용약관, 개인정보처리방침, 취소/환불정책, 포인트 충전·디지털 상품 안내가 표시됩니다. 포인트는 현금 환전·양도·개인 간 전달 없이 사이트 안의 디지털 상품 구매에만 사용하도록 운영합니다.
