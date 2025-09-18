import { Room } from "../core/Room";
import { HandlerContext } from "../core/Types";
import { handleAction } from "../core/Core";
import { SSEManager } from "../sse/SSEManager";
import { createSSE } from "../sse/SSE";

export class RoomDO {
  private room: Room | null = null;
  private sse: SSEManager;
  private state: DurableObjectState;

  constructor(private state: DurableObjectState, private env: any) {
    this.sse = new SSEManager({
      event: "init",
      data: {},
    });

  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // --- SSE 接続 ---
    if (url.pathname.endsWith("/sse")) {
      if (!this.room) {
        this.room = await Room.load(
          this.state.id.toString(),
          this.state.storage,
          this.sse
        );
      }
      return createSSE(this.sse, request);
    }

    // --- アクション処理 (join/move/leave/reset/hb etc.) ---
    const action = url.pathname.split("/").pop() ?? "";
    const params: Record<string, any> = await this.extractParams(request);

    if (!this.room) {
      this.room = await Room.load(
        this.state.id.toString(),
        this.state.storage,
        this.sse
      );
    }

    return handleAction({ room: this.room, state: this.state, env: this.env } as HandlerContext, action, params);
  }

  // --- アラーム処理 ---
  async alarm(): Promise<void> {
    //console.log("ALARM_FIRED", Date.now(), "size=", this.room?.activity.size);
    const hbTimeout = Number(this.env.HEARTBEAT_TIMEOUT ?? "30000");   // ms
    const luTimeout = Number(this.env.LASTUPDATE_TIMEOUT ?? "300000"); // ms
    const now = Date.now();

    for (const [token, rec] of this.room.activity.entries()) {
      const hbExpired = rec.hb > 0 && now - rec.hb > hbTimeout;
      const luExpired = rec.lu > 0 && now - rec.lu > luTimeout;

      // ★ OR 条件でまとめる
      if (hbExpired || luExpired) {
        this.room.leave(token);
        this.room.activity.delete(token);
        
        this.sse.broadcast({
          event: "leave",
          data: {
            status: this.room.status,
            step: this.step,
            black: !!this.room.black,
            white: !!this.room.white,
            board: this.boardData,
          },
        }); 
      }
    }

    if (this.room.activity.size > 0) {
      await this.state.storage.setAlarm(new Date(Date.now() + hbTimeout));
    }

    //await this.room.save();  
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