# 아키텍처

```txt
apps/web  : React + Vite 프론트엔드
apps/api  : Express API 서버
packages/shared : 공통 타입/검증 스키마
docs      : 기획/요구사항/운영 문서
.github   : CI 및 GitHub Pages 배포
```

## 데이터 흐름
팬이 크리에이터 상세 페이지에서 포인트 이용 요청을 생성하면 API의 `/api/supports`가 결제 완료 상태의 포인트 이용 데이터를 생성한다. 이후 대시보드와 관리자 화면에서 해당 데이터를 조회한다.
