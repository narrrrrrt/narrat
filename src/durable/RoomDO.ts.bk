import { Room } from "../core/Room";
import { handleAction } from "../core/Core";
import { SSEManager } from "../sse/SSEManager";
import { createSSE } from "../sse/SSE";

export class RoomDO {
  private room: Room | null = null;
  private sse: SSEManager;

  constructor(private state: DurableObjectState) {
    // ★ インスタンスごとに1つだけ SSEManager を持つ
    this.sse = new SSEManager({ event: "init" });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // --- SSE 接続 ---
    if (url.pathname.endsWith("/sse")) {
      if (!this.room) {
        // Room を初期化（ストレージからロード or 新規生成）
        this.room = await Room.load(
          this.state.id.toString(),
          this.state.storage,
          this.sse
        );
      }

      return createSSE(this.sse, request);
    }

    // --- アクション処理 (join/move/leave/reset) ---
    const action = url.pathname.split("/").pop() ?? "";
    const params: Record<string, any> = await this.extractParams(request);

    if (!this.room) {
      this.room = await Room.load(
        this.state.id.toString(),
        this.state.storage,
        this.sse
      );
    }

    return handleAction(this.room, action, params);
  }

  // GET クエリ / POST JSON を params にまとめる
  private async extractParams(request: Request): Promise<Record<string, any>> {
    if (request.method === "GET") {
      const url = new URL(request.url);
      return Object.fromEntries(url.searchParams.entries());
    }
    if (request.method === "POST") {
      return await request.json();
    }
    return {};
  }
}