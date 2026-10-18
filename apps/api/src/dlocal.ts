import { createHmac } from 'node:crypto';

export type DLocalConfig = {
  mode: 'sandbox' | 'production';
  apiBase: string;
  login: string;
  transKey: string;
  secretKey: string;
  ready: boolean;
};

export function dLocalConfig(env = process.env): DLocalConfig {
  const mode = env.DLOCAL_MODE === 'production' ? 'production' : 'sandbox';
  return {
    mode,
    apiBase: (env.DLOCAL_API_BASE || (mode === 'production' ? 'https://api.dlocal.com' : 'https://sandbox.dlocal.com')).replace(/\/$/, ''),
    login: env.DLOCAL_X_LOGIN || '',
    transKey: env.DLOCAL_X_TRANS_KEY || '',
    secretKey: env.DLOCAL_SECRET_KEY || '',
    ready: Boolean(env.DLOCAL_X_LOGIN && env.DLOCAL_X_TRANS_KEY && env.DLOCAL_SECRET_KEY)
  };
}

export function dLocalSignature(login: string, date: string, body: string, secretKey: string) {
  return createHmac('sha256', secretKey).update(login + date + body).digest('hex');
}

export async function dLocalRequest(path: string, body: Record<string, unknown>, config = dLocalConfig(), transport: typeof fetch = fetch) {
  if (!config.ready) throw new Error('DLOCAL_NOT_CONFIGURED');
  const date = new Date().toISOString();
  const payload = JSON.stringify(body);
  const response = await transport(`${config.apiBase}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Date': date,
      'X-Login': config.login,
      'X-Trans-Key': config.transKey,
      'X-Version': '2.1',
      'User-Agent': 'H&G-Agency/1.0',
      Authorization: `V2-HMAC-SHA256, Signature: ${dLocalSignature(config.login, date, payload, config.secretKey)}`
    },
    body: payload,
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`DLOCAL_HTTP_${response.status}`);
  return response.json();
}
