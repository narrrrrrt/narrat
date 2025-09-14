import { Room } from "../core/Room";

/*
 * leave
 * Room.leave() の本体を外出ししたもの
 * @param _ Room インスタンス
 * @param token ユーザーを識別するトークン
 */
export function leave(_: Room, token: string): void {
  // ★ まず activity からは無差別に削除
  _.activity.delete(token)

  // --- 黒がこのトークンなら解除 ---
  if (_.black === token) {
    _.black = null;
    _.status = "leave";
    _.step++;
    _.boardData = Array(8).fill("--------"); // 全マスをハイフン
    return;
  }

  // --- 白がこのトークンなら解除 ---
  if (_.white === token) {
    _.white = null;
    _.status = "leave";
    _.step++;
    _.boardData = Array(8).fill("--------");
    return;
  }

  // --- observer の場合 ---
  const idx = _.observers.indexOf(token);
  if (idx !== -1) {
    _.observers.splice(idx, 1);
    // 観戦者退出なのでステータスやボードは変更なし
    return;
  }

  _.scheduleAlarm();
}