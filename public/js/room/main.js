// public/js/room/main.js
import { apiJoin, apiLeave, apiMove, apiReset, apiHeartbeat } from "./api.js";

class RoomClient {
  constructor(id, seat) {
    this.id = id;
    this.seat = seat;
    this.token = null;
    this.step = null;
    this.hbTimer = null;
    this.sse = null;
  }

  init() {
    // {id} 置換
    document.querySelectorAll("[data-template]").forEach(el => {
      el.textContent = el.dataset.template.replace("{id}", this.id);
    });

    // イベント登録
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

    this.initBoard();
    this.connectSSE();
  }

  logResponse(label, data) {
    const logEl = document.getElementById("response-log");
    if (logEl) logEl.textContent = `${label}:\n` + JSON.stringify(data, null, 2);
  }

  async join() {
    const data = await apiJoin(this.id);
    if (data.token) {
      this.token = data.token;
      this.step = data.step;
      document.getElementById("your-token").textContent = this.token;
    }
    this.logResponse("JOIN", data);
  }

  async leave() {
    if (!this.token) return;
    const data = await apiLeave(this.id, this.token);
    this.token = null;
    document.getElementById("your-token").textContent = "-";
    this.logResponse("LEAVE", data);
  }

  async move(x, y) {
    if (!this.token) return;
    const data = await apiMove(this.id, this.token, x, y);
    if (data.board) this.renderBoard(data.board);
    if (data.step !== undefined) this.step = data.step;
    this.logResponse("MOVE", data);
  }

  async reset() {
    const data = await apiReset(this.id);
    this.logResponse("RESET", data);
  }

  startHeartbeat() {
    if (this.hbTimer || !this.token) return;
    this.hbTimer = setInterval(async () => {
      const data = await apiHeartbeat(this.id, this.token);
      this.logResponse("HEARTBEAT", data);
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
        cell.textContent = "-";
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
      const ch = board[y].charAt(x);
      cell.textContent = ch;
    });
  }
}

// 起動
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