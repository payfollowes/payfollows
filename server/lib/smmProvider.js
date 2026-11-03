// Minimal SMM-provider HTTP client shared by the session bridge and the
// key-authenticated reseller API. Providers speak form-urlencoded POSTs.

const DEFAULT_PROVIDER_API_URL = 'https://daosmm.com/api/v2';

export function getProviderApiUrl(provider) {
  const candidate = String(provider?.api_url || '').trim() || DEFAULT_PROVIDER_API_URL;
  return new URL(candidate);
}

export function buildProviderBody(apiKey, params) {
  const body = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      body.append(key, String(value));
    }
  });

  body.append('key', String(apiKey || ''));
  return body;
}

export function extractProviderError(data) {
  if (!data) return 'Empty response from provider';
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return null;
  return data.error || data.message || null;
}

export function mapProviderStatusToLocal(statusValue) {
  const rawStatus = String(statusValue || '').toLowerCase();

  if (!rawStatus) return 'processing';
  if (rawStatus.includes('pending')) return 'pending';
  if (rawStatus.includes('complete')) return 'completed';
  if (rawStatus.includes('cancel') || rawStatus.includes('refund')) return 'canceled';
  if (rawStatus.includes('fail') || rawStatus.includes('error')) return 'failed';
  if (rawStatus.includes('partial')) return 'processing';
  if (rawStatus.includes('process') || rawStatus.includes('progress') || rawStatus.includes('inprogress')) {
    return 'processing';
  }

  return 'processing';
}

/**
 * Call a DaoSMM-compatible provider API. Throws on transport/HTTP errors;
 * business errors are returned on the parsed payload for the caller to inspect
 * via extractProviderError().
 */
export async function callSmmProvider(provider, params) {
  const url = getProviderApiUrl(provider);
  const body = buildProviderBody(provider.api_key, params);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const rawBody = await response.text();
  let data;
  try {
    data = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    data = rawBody;
  }

  if (!response.ok) {
    throw new Error(
      `Provider API returned ${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`
    );
  }

  return data;
}
