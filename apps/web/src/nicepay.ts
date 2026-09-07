type Checkout = { clientId: string; method: 'card'; orderId: string; amount: number; goodsName: string; returnUrl: string };
declare global {
  interface Window {
    AUTHNICE?: { requestPay: (options: Checkout & { fnError: (error: { errorMsg?: string }) => void }) => void };
  }
}
let loading: Promise<void> | undefined;
export async function openNicepay(checkout: Checkout, onError: (message: string) => void) {
  if (!window.AUTHNICE) {
    loading ||= new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://pay.nicepay.co.kr/v1/js/';
      script.async = true;
      const timeout = window.setTimeout(() => { script.remove(); loading = undefined; reject(new Error('결제창 연결 시간이 초과되었습니다.')); }, 15000);
      script.onload = () => { clearTimeout(timeout); resolve(); };
      script.onerror = () => { clearTimeout(timeout); script.remove(); loading = undefined; reject(new Error('결제창을 불러오지 못했습니다.')); };
      document.head.appendChild(script);
    });
    await loading;
  }
  if (!window.AUTHNICE) { loading = undefined; throw new Error('결제 서비스를 사용할 수 없습니다.'); }
  window.AUTHNICE.requestPay({ ...checkout, fnError: () => onError('결제가 취소되었거나 결제창을 열지 못했습니다. 주문 상태를 확인해 주세요.') });
}
