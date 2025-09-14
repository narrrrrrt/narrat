import { heartbeat } from "./api.js";
import { appendLog } from "./utils.js";

let hbTimer = null;

export function startHeartbeat(id, token) {
  if (hbTimer) return;

  appendLog("HB", "Heartbeat started");

  hbTimer = setInterval(async () => {
    try {
      await heartbeat(id, token);
      appendLog("HB", "sent");
    } catch (err) {
      console.error("Heartbeat failed", err);
    }
  }, 1000);
}

export function stopHeartbeat() {
  if (hbTimer) {
    clearInterval(hbTimer);
    hbTimer = null;
    appendLog("HB", "Heartbeat stopped");
  }
}