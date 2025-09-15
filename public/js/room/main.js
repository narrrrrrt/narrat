import { getQueryParams, applyTemplates, appendLog } from "./utils.js";
import { join, move, leave, reset } from "./api.js"; 
import { startSSE } from "./sse.js";
import { applyBoard } from "./board.js";
import { startHeartbeat, stopHeartbeat } from "./heartbeat.js";

class RoomPage {
  constructor(id, seat) {
    this.id = id;
    this.role = seat;
    this.token = null;

    this.btnReset = document.getElementById("btn-reset");
    this.tokenSpan = document.getElementById("your-token");
    this.btnJoin = document.getElementById("btn-join");
    this.btnMove = document.getElementById("btn-move");
    this.btnLeave = document.getElementById("btn-leave");
    this.btnHbStart = document.getElementById("btn-hb-start");
    this.btnHbStop = document.getElementById("btn-hb-stop");
    this.selX = document.getElementById("select-x");
    this.selY = document.getElementById("select-y");
  }

  init() {
    this.btnReset.addEventListener("click", () => this.handleReset());
    this.btnJoin.addEventListener("click", () => this.handleJoin());
    this.btnMove.addEventListener("click", () => this.handleMove());
    this.btnLeave.addEventListener("click", () => this.handleLeave());
    this.btnHbStart.addEventListener("click", () => this.handleHbStart());
    this.btnHbStop.addEventListener("click", () => this.handleHbStop());

    startSSE(this.id, (type, data) => {
      appendLog(type, `step=${data.step}, status=${data.status}`);
      //applyBoard(data, this.role, this.btnMove);
      applyBoard(data, this.role, this.btnMove, this.id, this.token);
    });
  }

  async handleJoin() {
    const res = await join(this.id, this.role);
    if (res.token) {
      this.token = res.token;
      this.tokenSpan.textContent = this.token;
    }
    if (res.role) {
      this.role = res.role;
    }
    if (!res.ok) {
      appendLog("ERROR", res.error || "join failed");
    }
    // 盤面更新は SSE に任せる
  }
  
  async handleMove(x = null, y = null) {
    if (!this.token) return;
    const moveX = x !== null ? x : parseInt(this.selX.value, 10);
    const moveY = y !== null ? y : parseInt(this.selY.value, 10);
    const res = await move(this.id, this.token, moveX, moveY);
    if (!res.ok) {
      appendLog("ERROR", res.error || "move failed");
    }
    // 盤面更新は SSE で反映
  }

  async handleLeave() {
    if (!this.token) return;
    await leave(this.id, this.token);
    this.token = null;
    this.tokenSpan.textContent = "-";
  }
  
  async handleReset() {
    const res = await reset(this.id);
    alert(res.ok);
    // 盤面更新は引き続き SSE "reset" イベントで反映
  }

  handleHbStart() {
    if (!this.token) {
      alert("Join first to get a token.");
      return;
    }
    startHeartbeat(this.id, this.token);
  }

  handleHbStop() {
    stopHeartbeat();
  }
}

window.onload = () => {
  const { id, seat } = getQueryParams();
  if (!id || !seat) {
    alert("Missing query parameters: id or seat");
    return;
  }

  applyTemplates(id, seat);

  const room = new RoomPage(id, seat);
  room.init();
};