// public/js/room/api.js

// 共通fetchラッパ
async function apiFetch(path, options = {}) {
  const defaultHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };

  const res = await fetch(path, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// 各エンドポイント呼び出し
export async function apiJoin(id) {
  return apiFetch(`/${id}/join`, { method: "POST" });
}

export async function apiLeave(id, token) {
  return apiFetch(`/${id}/leave`, {
    method: "POST",
    body: JSON.stringify({ token })
  });
}

export async function apiMove(id, token, x, y) {
  return apiFetch(`/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ token, x, y })
  });
}

export async function apiReset(id) {
  return apiFetch(`/${id}/reset`, { method: "POST" });
}

export async function apiHeartbeat(id, token) {
  return apiFetch(`/${id}/hb`, {
    method: "POST",
    body: JSON.stringify({ token })
  });
}