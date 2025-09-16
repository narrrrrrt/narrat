import { Room } from "../core/Room";
import { Seat } from "../core/Types";

/**
 * Room.leave() の本体
 * - 黒/白プレイヤーが抜けたら盤面リセット
 * - 観戦者は observers 配列から削除
 * @returns Seat ("black" | "white" | "observer")
 */
export function leave(_: Room, token: string): Seat {
  _.activity.delete(token);

  if (_.black === token) {
    _.black = null;
    _.status = "leave";
    _.step++;
    _.boardData = Array(8).fill("--------");
    return "black";
  }

  if (_.white === token) {
    _.white = null;
    _.status = "leave";
    _.step++;
    _.boardData = Array(8).fill("--------");
    return "white";
  }

  _.observers = _.observers.filter(t => t !== token);
  
  return "observer";
}