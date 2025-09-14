export async function join(id, seat) {
  const url = `/${id}/join`;
  const body = { seat };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return await res.json();
}

export async function move(id, token, x, y) {
  const url = `/${id}/move`;
  const body = { token, x, y };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return await res.json();
}

export async function leave(id, token) {
  const url = `/${id}/leave`;
  const body = { token };
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function heartbeat(id, token) {
  const url = `/${id}/hb`;
  const body = { token };
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}