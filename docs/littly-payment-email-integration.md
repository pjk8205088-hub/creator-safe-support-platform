# 리틀리 결제 알림 수집

리틀리는 공개된 외부 Direct API/webhook 대신 판매자에게 결제 완료 알림톡과 이메일을 제공합니다. 따라서 이 프로젝트는 메일함 비밀번호를 서버에 저장하지 않고, Make/Zapier 같은 자동화 도구에서 리틀리 결제 알림 이메일을 받아 내부 수신 API로 전달하는 구조를 사용합니다.

## 1. 서버 환경변수

`LITTLY_INBOUND_EMAIL_SECRET`에 긴 랜덤 값을 등록합니다. 이 값은 채팅이나 저장소에 공개하지 않습니다.

수신 주소:

`POST https://<API-주소>/api/integrations/littly/payment-email`

헤더:

`x-littly-inbound-secret: <LITTLY_INBOUND_EMAIL_SECRET>`

JSON 본문:

```json
{
  "subject": "리틀리 결제 완료 알림",
  "from": "notification@example.com",
  "text": "주문번호 ... 금액 ...",
  "receivedAt": "2026-09-16T12:00:00.000Z"
}
```

## 2. Make/Zapier 설정

1. 리틀리 관리자에서 판매자 결제 알림 이메일 수신 주소를 확인합니다.
2. Gmail/메일 수신 트리거에서 리틀리 결제 알림 메일만 필터링합니다.
3. HTTP POST 액션으로 위 API 주소와 헤더를 등록합니다.
4. 제목, 발신자, 본문, 수신 시각을 JSON 필드에 매핑합니다.
5. 테스트 요청 후 관리자 API `GET /api/admin/integrations/littly/payment-emails`에서 수신 기록을 확인합니다.

현재 수신 기록은 결제 원장으로 자동 확정되지 않습니다. 주문번호와 금액을 파싱하고 중복·취소·환불을 검증하는 절차는 리틀리의 공식 데이터 제공 범위 확인 후 별도 구현해야 합니다.
