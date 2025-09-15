// js/room/Room.js

const state = {
  id: null,
  seat: null,
  token: null,
  hbTimer: null,
  sse: null,
};

function log(label, payload) {
  const el = document.getElementById("log");
  el.textContent = `${label}:\n` + JSON.stringify(payload, null, 2);
}

// ボディがある時だけ Content-Type を付ける
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

function connectSSE() {
  const url = `${location.origin}/${state.id}/status`;
  state.sse = new EventSource(url);

  // 接続状態を見たいので onopen / onerror もログ
  state.sse.onopen = () => log("SSE OPEN", { url });
  state.sse.onerror = () => {
    // readyState: 0=CONNECTING, 1=OPEN, 2=CLOSED
    log("SSE ERROR", { readyState: state.sse.readyState });
  };

  const handle = (evName) => (e) => {
    let data;
    try { data = JSON.parse(e.data); } catch { data = e.data; }
    // 盤面と補足情報を反映
    if (data && data.board) renderBoard(data.board);
    updateInfo(data);
    log(`SSE ${evName}`, data);
  };

  // いまはデバッグ目的で全て拾う（後で join/move/leave だけに戻せる）
  ["join", "move", "leave", "reset", "init", "pulse"].forEach(ev => {
    state.sse.addEventListener(ev, handle(ev));
  });

  // event: が無い「デフォルト message」用の保険
  state.sse.onmessage = handle("message");
}

// --- Button handlers ---

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
  // 仮の座標（後でクリック座標に差し替え）
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
  // ★ 重要: reset は空ボディだと Workers 側の request.json() で落ちるため {} を送る
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

// --- bootstrap (type="module" なので onload不要) ---

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
