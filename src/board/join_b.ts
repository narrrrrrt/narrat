import { Room, Seat } from "../core/Room";
import { JoinResult } from "../core/Types";

// ★ トークン生成関数はここに閉じ込める
function generateToken(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function join(_: Room, token?: string, seat?: Seat): JoinResult {
  let finalToken = token ?? generateToken();
  let role: Seat;

  if (token) {
    if (seat) {
      // 3. 継続 (リセット希望)
      if ((seat === "black" && _.black === token) ||
          (seat === "white" && _.white === token)) {
        _.boardData = _.defaultBoard();
        _.status = "waiting";
        _.step = 0;
        role = seat;
      } else if (seat === "black" && !_.black) {
        _.black = finalToken;
        role = "black";
      } else if (seat === "white" && !_.white) {
        _.white = finalToken;
        role = "white";
      } else {
        _.observers.push(finalToken);
        role = "observer";
      }
    } else {
      // 2. 継続 (リロード)
      if (_.black === token) {
        role = "black";
      } else if (_.white === token) {
        role = "white";
      } else if (_.observers.includes(token)) {
        role = "observer";
      } else {
        finalToken = generateToken();
        _.observers.push(finalToken);
        role = "observer";
      }
    }
  } else {
    // 1. 新規 join
    if (seat === "black" && !_.black) {
      _.black = finalToken;
      _.step = 0;
      role = "black";
    } else if (seat === "white" && !_.white) {
      _.white = finalToken;
      _.step = 0;
      role = "white";
    } else {
      _.observers.push(finalToken);
      role = "observer";
    }
  }

  // ステータス更新
  if (_.black && _.white) {
    _.status = "black";
    _.boardData = _.legalBoard("black");
  } else {
    _.boardData = _.defaultBoard();
  }

  return { role, token: finalToken };
}