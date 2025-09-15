// main-min.js

const state = {
  id: null,
  seat: null,
  token: null,
  hbTimer: null,
};

function log(label, payload) {
  const el = document.getElementById("log");
  el.textContent = `${label}:\n` + JSON.stringify(payload, null, 2);
}

// ボディがある時だけ Content-Type: application/json を付ける
async function api(path, body = undefined) {
  const headers = { Accept: "application/json" };
  const options = { method: "POST", headers };

  if (body !== undefined && body !== null) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(path, options);
    const text = await res.text();

    // 返却はステータスと中身をそのままログれる形に
    const out = { status: res.status, ok: res.ok, url: res.url };
    try { out.data = JSON.parse(text); } catch { out.text = text; }
    return out;
  } catch (err) {
    return { error: String(err) };
  }
}

async function join() {
  // JOIN は seat をボディで送る（サーバ側が body.json() 前提のため）
  const res = await api(`/${state.id}/join`, { seat: state.seat });
  if (res?.data?.token) state.token = res.data.token;
  log("JOIN", res);
}

async function move() {
  if (!state.token) return log("MOVE", { error: "no token" });
  // ダミーの座標（後でUIから拾うように差し替え）
  const res = await api(`/${state.id}/move`, { token: state.token, x: 3, y: 2 });
  log("MOVE", res);
}

async function leave() {
  if (!state.token) return log("LEAVE", { error: "no token" });
  const res = await api(`/${state.id}/leave`, { token: state.token });
  state.token = null;
  log("LEAVE", res);
}

async function reset() {
  // RESET はボディ無し＝Content-Type を付けない（今回の肝）
  const res = await api(`/${state.id}/reset`);
  log("RESET", res);
}

function startHeartbeat() {
  if (!state.token) return log("HB", { error: "no token" });
  if (state.hbTimer) return;
  state.hbTimer = setInterval(async () => {
    const res = await api(`/${state.id}/hb`, { token: state.token });
    log("HB", res);
  }, 1000);
}

function stopHeartbeat() {
  if (state.hbTimer) {
    clearInterval(state.hbTimer);
    state.hbTimer = null;
  }
}

// 初期化（type="module" なので onload 要らない）
const params = new URLSearchParams(location.search);
state.id = params.get("id");
state.seat = params.get("seat");

if (!state.id || !state.seat) {
  alert("id と seat が必要です（例: ?id=1&seat=black）");
} else {
  document.getElementById("btn-join").onclick = join;
  document.getElementById("btn-move").onclick = move;
  document.getElementById("btn-leave").onclick = leave;
  document.getElementById("btn-reset").onclick = reset;
  document.getElementById("btn-hb-start").onclick = startHeartbeat;
  document.getElementById("btn-hb-stop").onclick = stopHeartbeat;
}