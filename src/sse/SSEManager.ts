import { SSEMessage } from "../core/Types";

export class SSEManager {
  private connections: Set<WritableStreamDefaultWriter>;
  private initPayload?: SSEMessage;
  private queue: string[] = [];           // ★ メッセージキュー
  private flushing = false;               // ★ flush 中かどうか
  private pulseTimer?: NodeJS.Timer;      // ★ pulse タイマー保持

  constructor(initPayload?: SSEMessage) {
    this.connections = new Set();
    this.initPayload = initPayload;

    // ★ 定期 pulse をセット（例: 30 秒ごと）
    this.pulseTimer = setInterval(() => {
      if (this.connections.size > 0) {
        this.broadcast({ event: "pulse", data: {} });
      }
    }, 3000);
  }

  // 新しい SSE 接続を登録
  addConnection(writer: WritableStreamDefaultWriter) {
    this.connections.add(writer);

    // 接続直後に初回イベントを送信（あれば）
    if (this.initPayload) {
      const msg =
        `event: ${this.initPayload.event}\n` +
        `data: ${JSON.stringify(this.initPayload.data ?? {})}\n\n`;
      
      this.queue.push(msg);
      this.flush();
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

  // ★ 既存コード用の broadcast（enqueue + flush）
  broadcast(payload: SSEMessage) {
    const msg =
      `event: ${payload.event}\n` +
      `data: ${JSON.stringify(payload.data ?? {})}\n\n`;
    this.queue.push(msg);
    this.flush();
  }

  // ★ flush: キューを順番に処理する
  private async flush() {
    if (this.flushing) return; // 既に flush 中ならスキップ
    this.flushing = true;

    const encoder = new TextEncoder();

    while (this.queue.length > 0) {
      const msg = this.queue.shift()!;
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

    this.flushing = false;
  }

  // ★ 明示的に pulse を止めたいとき用
  stopPulse() {
    if (this.pulseTimer) {
      clearInterval(this.pulseTimer);
    }
  }
}