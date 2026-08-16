# 토스페이먼츠 연동 메모

## 현재 완료된 작업

- 웹앱 패키지에 `@tosspayments/tosspayments-sdk` 설치 완료
- `apps/web/.env.example`에 `VITE_TOSS_CLIENT_KEY` 환경변수 추가
- MVP에서는 실제 승인/매입이 아닌 Mock 결제 완료 흐름으로 동작
- 실제 결제 전환 시 프론트엔드는 토스 결제창/결제위젯을 호출하고, 백엔드는 `paymentKey`, `orderId`, `amount` 검증 후 승인 API를 호출해야 함

## 사용자가 직접 신청해야 하는 항목

토스페이먼츠 가맹점/상점 신청은 사업자 정보, 대표자/상품 제공 계좌, 업종, 심사 서류가 필요하므로 사용자가 직접 진행해야 합니다.

신청 후 필요한 값:

- 테스트 클라이언트 키
- 테스트 시크릿 키
- 라이브 클라이언트 키
- 라이브 시크릿 키
- 상점 ID 또는 브랜드페이/결제위젯 설정값

## 환경변수 예시

### Frontend

```env
VITE_API_URL=http://localhost:4000
VITE_TOSS_CLIENT_KEY=test_ck_xxxxxxxxxxxxxxxxx
```

### Backend

```env
PORT=4000
WEB_ORIGIN=http://localhost:5173
TOSS_SECRET_KEY=test_sk_xxxxxxxxxxxxxxxxx
```

## 실제 결제 전환 작업

- [ ] 토스페이먼츠 가맹점 신청
- [ ] 테스트 키 발급
- [ ] 프론트 결제 요청 UI 연결
- [ ] 백엔드 결제 승인 API 구현
- [ ] 결제 성공/실패/취소 페이지 구현
- [ ] 금액 위변조 방지 검증
- [ ] 환불 API 구현
- [ ] 상품 제공 대시보드에 실제 결제 상태 반영
