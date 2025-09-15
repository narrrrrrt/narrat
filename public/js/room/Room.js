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

// ボディがあるときだけ Content-Type を付ける
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
    const out = { status: res.status, ok: res.ok, url: res.url };
    try { out.data = JSON.parse(text); } catch { out.text = text; }
    return out;
  } catch (err) {
    return { error: String(err) };
  }
}

async function join() {
  const res = await api(`/${state.id}/join`, { seat: state.seat });
  if (res?.data?.token) state.token = res.data.token;
  log("JOIN", res);
}

async function move() {
  if (!state.token) return log("MOVE", { error: "no token" });
  // 仮に (3,2) に固定
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
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const cell = document.getElementById(`cell-${x}-${y}`);
      if (cell) cell.textContent = board[y].charAt(x);
    }
  }
}

function connectSSE() {
  state.sse = new EventSource(`/${state.id}/status`);

  ["join", "move", "leave"].forEach(ev => {
    state.sse.addEventListener(ev, e => {
      const data = JSON.parse(e.data);
      log("SSE " + ev, data);

      if (data.board) renderBoard(data.board);

      // ログに board 以外の情報も出したいので
      const info = {
        status: data.status,
        step: data.step,
        black: data.black,
        white: data.white,
      };
      console.log("Board info:", info);
    });
  });
}

// 初期化
const params = new URLSearchParams(location.search);
state.id = params.get("id");
state.seat = params.get("seat");

if (!state.id || !state.seat) {
  alert("id と seat が必要です (?id=1&seat=black)");
} else {
  document.getElementById("btn-join").onclick = join;
  document.getElementById("btn-move").onclick = move;
  document.getElementById("btn-leave").onclick = leave;
  document.getElementById("btn-reset").onclick = reset;
  document.getElementById("btn-hb-start").onclick = startHeartbeat;
  document.getElementById("btn-hb-stop").onclick = stopHeartbeat;

  initBoard();
  connectSSE();
}