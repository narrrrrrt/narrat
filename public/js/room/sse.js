import { appendLog } from "./utils.js";

export function startSSE(id, onData) {
  const es = new EventSource(`/${id}/sse`);

  es.addEventListener("reset", (event) => {
    const data = JSON.parse(event.data);
    onData("RESET", data);
  });

  es.addEventListener("join", (event) => {
    const data = JSON.parse(event.data);
    onData("JOIN", data);
  });

  es.addEventListener("move", (event) => {
    const data = JSON.parse(event.data);
    onData("MOVE", data);
  });

  es.addEventListener("leave", (event) => {
    const data = JSON.parse(event.data);
    onData("LEAVE", data);
  });

  es.onerror = () => {
    appendLog("SSE", "connection closed");
    es.close();
  };
}