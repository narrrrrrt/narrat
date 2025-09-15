// js/room/Room.js

const state = {
  id: null,
  seat: null,
  token: null,
  hbTimer: null,
  sse: null,
  sseRetryMs: 1000, // 自動再接続用
  lastEventAt: 0,
};

function log(label, payload) {
  const el = document.getElementById("log");
  const now = new Date().toLocaleTimeString();
  el.textContent = `${now} ${label}:\n` + JSON.stringify(payload, null, 2);
}

/* ---------------- API（ボディがあるときだけ Content-Type を付ける） ---------------- */
async function api(path, body = undefined) {
  const headers = { Accept: "application/json" };
  const opts = { method: "POST", headers };
  if (body !== undefined && body !== null) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  try {
    const res = await fetch(path, opts);
    const text = await res.text();
    const out = { status: res.status, ok: res.ok, url: res.url };
    try { out.data = JSON.parse(text); } catch { out.text = text; }
    return out;
  } catch (err) {
    return { error: String(err) };
  }
}

/* ---------------- Board ---------------- */
function initBoard() {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";
  for (let y = 0; y < 8; y++) {
    const row = document.createElement("div");
    row.className = "row";
    for (let x = 0; x < 8; x++) {
      const cell = document.createElement("span");
      cell.className = "cell";
      cell.id = `cell-${x}-${y}`;
      cell.textContent = "-";
      row.appendChild(cell);
    }
    boardEl.appendChild(row);
  }
}

function renderBoard(board) {
  if (!Array.isArray(board) || board.length !== 8) return;
  for (let y = 0; y < 8; y++) {
    const line = board[y] || "--------";
    for (let x = 0; x < 8; x++) {
      const cell = document.getElementById(`cell-${x}-${y}`);
      if (cell) cell.textContent = line.charAt(x) || "-";
    }
  }
}

function updateInfo(data) {
  if (!data) return;
  if ("status" in data) document.getElementById("info-status").textContent = data.status;
  if ("step"   in data) document.getElementById("info-step").textContent   = data.step;
  if ("black"  in data) document.getElementById("info-black").textContent  = String(data.black);
  if ("white"  in data) document.getElementById("info-white").textContent  = String(data.white);
}

/* ---------------- SSE（ロビー方式に寄せる） ---------------- */
function connectSSE() {
  const url = `${location.origin}/${state.id}/status?stream=1`; // 絶対URL + キャッシュ回避クエリ
  if (state.sse) {
    try { state.sse.close(); } catch {}
    state.sse = null;
  }

  const es = new EventSource(url /* , { withCredentials: true } */);
  state.sse = es;
  log("SSE CONNECT", { url });

  es.onopen = () => {
    state.lastEventAt = Date.now();
    state.sseRetryMs = 1000; // 成功したらリトライ間隔をリセット
    log("SSE OPEN", { url });
  };

  es.onerror = () => {
    const rs = es.readyState; // 0=CONNECTING, 1=OPEN, 2=CLOSED
    log("SSE ERROR", { readyState: rs });
    try { es.close(); } catch {}
    state.sse = null;
    // バックオフして再接続
    setTimeout(connectSSE, state.sseRetryMs);
    state.sseRetryMs = Math.min(state.sseRetryMs * 2, 10000);
  };

  const handle = (evName) => (e) => {
    state.lastEventAt = Date.now();
    let data;
    try { data = JSON.parse(e.data); } catch { data = e.data; }

    if (data && data.board) renderBoard(data.board);
    updateInfo(data);
    log(`SSE ${evName}`, data);
  };

  // ロビー同様、メッセージ系は全部拾う（join/move/leaveが本命、init/pulse/resetはデバッグ用）
  ["join", "move", "leave", "reset", "init", "pulse"].forEach(ev => {
    es.addEventListener(ev, handle(ev));
  });

  // event: が付かない broadcast も保険で拾う
  es.onmessage = handle("message");
}

/* ---------------- Handlers ---------------- */
async function handleJoin() {
  const res = await api(`/${state.id}/join`, { seat: state.seat });
  if (res?.data?.token) {
    state.token = res.data.token;
    document.getElementById("meta-token").textContent = state.token;
  }
  log("JOIN", res);
}

async function handleMove() {
  if (!state.token) return log("MOVE", { error: "no token" });
  // 仮の座標（あとでクリック座標に差し替え）
  const res = await api(`/${state.id}/move`, { token: state.token, x: 3, y: 2 });
  log("MOVE", res);
}

async function handleLeave() {
  if (!state.token) return log("LEAVE", { error: "no token" });
  const res = await api(`/${state.id}/leave`, { token: state.token });
  state.token = null;
  document.getElementById("meta-token").textContent = "-";
  log("LEAVE", res);
}

async function handleReset() {
  // ★ reset は {} を送る（空ボディで JSON 読みにいって落ちる対策）
  const res = await api(`/${state.id}/reset`, {});
  log("RESET", res);
}

function handleHbStart() {
  if (!state.token) return log("HB", { error: "no token" });
  if (state.hbTimer) return;
  state.hbTimer = setInterval(async () => {
    const res = await api(`/${state.id}/hb`, { token: state.token });
    log("HB", res);
  }, 1000);
}

function handleHbStop() {
  if (state.hbTimer) {
    clearInterval(state.hbTimer);
    state.hbTimer = null;
  }
}

/* ---------------- bootstrap ---------------- */
const params = new URLSearchParams(location.search);
state.id = params.get("id");
state.seat = params.get("seat");

document.getElementById("meta-id").textContent = state.id || "-";
document.getElementById("meta-seat").textContent = state.seat || "-";

if (!state.id || !state.seat) {
  alert("id と seat が必要です（例: ?id=1&seat=black）");
} else {
  initBoard();
  connectSSE();

  document.getElementById("btn-join").onclick = handleJoin;
  document.getElementById("btn-move").onclick = handleMove;
  document.getElementById("btn-leave").onclick = handleLeave;
  document.getElementById("btn-reset").onclick = handleReset;
  document.getElementById("btn-hb-start").onclick = handleHbStart;
  document.getElementById("btn-hb-stop").onclick = handleHbStop;
}