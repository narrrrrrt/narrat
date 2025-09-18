// === 型定義 ===
import { Seat, Status } from "./Types";
import { legalBoard } from "../board/legalBoard";

// === 外出しメソッドをインポート ===
import { join } from "../board/join_b";
import { move } from "../board/move_b";
import { leave } from "../board/leave_b";
import { reset } from "../board/reset_b";

// === SSE 管理クラスをインポート ===
import { SSEManager } from "../sse/SSEManager";

export class Room {
  id: string;
  black: string | null = null;
  white: string | null = null;
  observers: string[] = [];
  status: Status = "waiting";
  boardData: string[] = this.defaultBoard();
  step: number = 0;

  sse: SSEManager; // ★ 部屋ごとに1つの SSE 管理オブジェクト
  
  // ★ 追加: activity (token → hb/lu)
  activity: Map<string, { hb: number; lu: number }> = new Map();

  private storage: DurableObjectStorage;

  constructor(
    id: string,
    storage: DurableObjectStorage,
    sse: SSEManager,
    initData?: any
  ) {
    this.id = id;
    this.storage = storage;
    this.sse = sse;

    if (initData) {
      this.black     = initData.black     ?? this.black;
      this.white     = initData.white     ?? this.white;
      this.observers = initData.observers ?? this.observers;
      this.status    = initData.status    ?? this.status;
      this.boardData = initData.boardData ?? this.boardData;
      this.step      = initData.step      ?? this.step;
    }
  }

  async save() {
    await this.storage.put("room", {
      black: this.black,
      white: this.white,
      observers: this.observers,
      status: this.status,
      boardData: this.boardData,
      step: this.step,
    });
  }

  static async load(
    id: string,
    storage: DurableObjectStorage,
    sse: SSEManager
  ) {
    const data = await storage.get("room");
    return new Room(id, storage, sse, data);
  }

  private defaultBoard(): string[] {
    return [
      "--------",
      "--------",
      "--------",
      "---WB---",
      "---BW---",
      "--------",
      "--------",
      "--------",
    ];
  }

  // === 外出しメソッド呼び出し ===
  join(token?: string, seat?: Seat): JoinResult {
    return join(this, token, seat);
  }

  move(x: number, y: number, token: string): MoveResult {
    return move(this, x, y, token);
  }

  leave(token: string) {
    return leave(this, token);
  }

  reset() {
    return reset(this);
  }
  
  /*
   * 合法手付きの盤面を返す
   * @param turn 現在の手番 ("black" | "white")
   * @returns 8×8 の文字列配列
   */
  legalBoard(turn: "black" | "white"): string[] {
    return legalBoard(this, turn);  // ★ 外出しメソッド呼び出し
  }

  // --- LU/HB 共通更新メソッド ---
  private updateActivity(token: string, field: "hb" | "lu") {
    let rec = this.activity.get(token);

    if (!rec) {
      rec = { hb: 0, lu: 0 };
    }

    rec[field] = Date.now();

    this.activity.set(token, rec);
    
    return this.activity.size === 1;
  }

  public deleteActivityToken(token: string): boolean {
    this.activity.delete(token);
    return this.activity.size === 0;
  }
}