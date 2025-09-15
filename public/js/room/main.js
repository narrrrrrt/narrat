// public/js/room/main.js

class RoomClient {
  constructor(id, seat) {
    this.id = id;
    this.seat = seat;
    this.token = null;
    this.step = null;
    this.hbTimer = null;
    this.sse = null;
    this.currentTurn = null;
  }

  init() {
    // {id} を置換
    document.querySelectorAll("[data-template]").forEach(el => {
      el.textContent = el.dataset.template.replace("{id}", this.id);
    });

    // ボタンにイベント登録
    document.getElementById("btn-join").addEventListener("click", () => this.join());
    document.getElementById("btn-leave").addEventListener("click", () => this.leave());
    document.getElementById("btn-move").addEventListener("click", () => {
      const x = parseInt(document.getElementById("select-x").value, 10);
      const y = parseInt(document.getElementById("select-y").value, 10);
      this.move(x, y);
    });
    document.getElementById("btn-reset").addEventListener("click", () => this.reset());
    document.getElementById("btn-hb-start").addEventListener("click", () => this.startHeartbeat());
    document.getElementById("btn-hb-stop").addEventListener("click", () => this.stopHeartbeat());

    // ボード初期化（64セル）
    this.initBoard();

    // SSE 接続開始
    this.connectSSE();
  }

  // レスポンスを画面に出力
  logResponse(label, data) {
    const logEl = document.getElementById("response-log");
    if (logEl) {
      logEl.textContent = `${label}:\n` + JSON.stringify(data, null, 2);
    }
  }

  async join() {
    const res = await fetch(`/${this.id}/join`, { method: "POST" });
    const data = await res.json();
    this.token = data.token;
    this.step = data.step;
    document.getElementById("your-token").textContent = this.token;
    this.logResponse("JOIN", data);
  }

  async leave() {
    if (!this.token) return;
    const res = await fetch(`/${this.id}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: this.token })
    });
    const data = await res.json();
    this.token = null;
    document.getElementById("your-token").textContent = "-";
    this.logResponse("LEAVE", data);
  }

  async move(x, y) {
    if (!this.token) return;
    const res = await fetch(`/${this.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: this.token, x, y })
    });
    const data = await res.json();
    if (data.board) this.renderBoard(data.board);
    if (data.step !== undefined) this.step = data.step;
    this.logResponse("MOVE", data);
  }

  async reset() {
    const res = await fetch(`/${this.id}/reset`, { method: "POST" });
    const data = await res.json();
    this.logResponse("RESET", data);
  }

  startHeartbeat() {
    if (this.hbTimer || !this.token) return;
    this.hbTimer = setInterval(() => {
      fetch(`/${this.id}/hb`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: this.token })
      })
        .then(res => res.json())
        .then(data => this.logResponse("HEARTBEAT", data))
        .catch(err => this.logResponse("HEARTBEAT ERROR", { error: err.message }));
    }, 1000);
  }

  stopHeartbeat() {
    if (this.hbTimer) {
      clearInterval(this.hbTimer);
      this.hbTimer = null;
    }
  }

  connectSSE() {
    this.sse = new EventSource(`/${this.id}/status`);

    this.sse.addEventListener("join", ev => {
      const data = JSON.parse(ev.data);
      if (data.role) {
        this.seat = data.role;
        document.getElementById("your-seat").textContent = this.seat;
      }
      if (data.board) this.renderBoard(data.board);
      if (data.step !== undefined) this.step = data.step;
      this.logResponse("SSE JOIN", data);
    });

    this.sse.addEventListener("move", ev => {
      const data = JSON.parse(ev.data);
      if (data.board) this.renderBoard(data.board);
      if (data.step !== undefined) this.step = data.step;
      this.logResponse("SSE MOVE", data);
    });

    this.sse.addEventListener("leave", ev => {
      const data = JSON.parse(ev.data);
      if (data.board) this.renderBoard(data.board);
      if (data.step !== undefined) this.step = data.step;
      this.logResponse("SSE LEAVE", data);
    });
  }

  initBoard() {
    const boardEl = document.getElementById("board");
    if (!boardEl) return;
    boardEl.innerHTML = "";
    for (let y = 0; y < 8; y++) {
      const row = document.createElement("div");
      row.className = "row";
      for (let x = 0; x < 8; x++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.x = x;
        cell.dataset.y = y;
        cell.textContent = "-"; // 初期は空
        cell.addEventListener("click", () => this.move(x, y));
        row.appendChild(cell);
      }
      boardEl.appendChild(row);
    }
  }

  renderBoard(board) {
    const cells = document.querySelectorAll("#board .cell");
    cells.forEach(cell => {
      const x = parseInt(cell.dataset.x, 10);
      const y = parseInt(cell.dataset.y, 10);
      const ch = board[y].charAt(x); // 1文字抽出
      cell.textContent = ch;
    });
  }
}

// 起動処理
window.addEventListener("load", () => {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const seat = params.get("seat");
  if (!id || !seat) {
    alert("id と seat が必要です");
    return;
  }
  const client = new RoomClient(id, seat);
  client.init();
});