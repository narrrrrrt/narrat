import { SSEMessage } from "../core/Types";

export class SSEManager {
  private connections: Set<WritableStreamDefaultWriter>;
  private initPayload?: SSEMessage;

  constructor(initPayload?: SSEMessage) {
    this.connections = new Set();
    this.initPayload = initPayload;
    
    // ★ ここで定期 pulse をセット（例: 30 秒ごと）
    this.pulseTimer = setInterval(() => {
      if (this.connections.size > 0) {
        this.broadcast({ event: "pulse", data: {} });
      }
    }, 30000); 
  }

  // 新しい SSE 接続を登録
  addConnection(writer: WritableStreamDefaultWriter) {
    this.connections.add(writer);

    // 接続直後に初回イベントを送信（あれば）
    if (this.initPayload) {
      const encoder = new TextEncoder();
      const msg =
        `event: ${this.initPayload.event}\n` +
        `data: ${JSON.stringify(this.initPayload.data ?? {})}\n\n`;
      writer.write(encoder.encode(msg)).catch(() => {
        this.removeConnection(writer);
      });
    }
  }

  // 接続を削除
  removeConnection(writer: WritableStreamDefaultWriter) {
    try {
      writer.close();
    } catch {
      // すでに閉じている場合などは無視
    }
    this.connections.delete(writer);
  }

  // 全クライアントにメッセージを配信
  async broadcast(payload: SSEMessage) {
    const msg =
      `event: ${payload.event}\n` +
      `data: ${JSON.stringify(payload.data ?? {})}\n\n`;

    const encoder = new TextEncoder();
    const bytes = encoder.encode(msg);

    const toRemove: WritableStreamDefaultWriter[] = [];
    for (const w of this.connections) {
      try {
        await w.write(bytes);
      } catch {
        toRemove.push(w);
      }
    }
    for (const w of toRemove) this.removeConnection(w);
  }
}