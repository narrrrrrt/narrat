import { DurableObjectState } from "@cloudflare/workers-types";
import { Room } from "./Room";

export interface HandlerContext {
  room: Room;
  state: DurableObjectState;
  env: any;
}

// プレイヤーの座席
export type Seat = "black" | "white" | "observer";

// 部屋の状態
export type Status = "waiting" | "black" | "white" | "leave" | "finished";

// fetch レスポンス用
export interface ResponsePayload {
  ok: boolean;       // 成功/失敗
  step?: number;     // ステップ数
  error?: string;    // エラー時のメッセージ
  role?: Seat;       // join 時の役割
  token?: string;    // join 時に払い出されたトークン
}

// SSE プロトコル準拠のメッセージ型
export interface SSEMessage {
  event: string; // join / move / leave / reset / init / ping...
  data?: {
    status: Status;   // 部屋の状態
    step: number;     // ステップ数
    role?: Seat;      // 役割（join のときのみ）
    black: boolean;  // 黒が埋まっているか
    white: boolean;  // 白が埋まっているか 
    board: string[];  // 盤面 ("B","W","-","*")
  };
}

// ハンドラーの戻り値
export interface MethodResult {
  broadcast?: SSEMessage;     // SSE に流すイベント
  response: ResponsePayload;  // fetch のレスポンス
  status?: number;            // HTTP ステータスコード（デフォルト 200）
}

// move_b.ts の内部用
export interface MoveResult {
  ok: boolean;   // 成功 or 失敗
  reason?: "token_mismatch" | "illegal_pass" | "invalid_move";
}}

// ★ Join の結果を表す型
export interface JoinResult {
  role: Seat;     // 黒 / 白 / オブザーバー
  token: string;  // セッションを識別するトークン
}


