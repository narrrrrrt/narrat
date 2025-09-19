import { Room, Seat } from "../core/Room";
import { JoinResult } from "../core/Types";

// ★ トークン生成関数はここに閉じ込める
function generateToken(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function join(_: Room, token?: string, seat?: Seat): JoinResult {
  let finalToken: string;
  let role: Seat;

  if (token) {
    if (seat) {
      // seat + token → リロード継続
      if ((seat === "black" && _.black === token) ||
          (seat === "white" && _.white === token)) {
        role = seat;
        finalToken = token;
      } else {
        // 不一致 → observer 新規
        finalToken = generateToken();
        _.observers.push(finalToken);
        role = "observer";
      }
    } else {
      // token のみ → リセット
      if (_.black === token) {
        _.boardData = _.defaultBoard();
        _.status = "waiting";
        _.step = 0;
        role = "black";
        finalToken = token;
      } else if (_.white === token) {
        _.boardData = _.defaultBoard();
        _.status = "waiting";
        _.step = 0;
        role = "white";
        finalToken = token;
      } else {
        finalToken = generateToken();
        _.observers.push(finalToken);
        role = "observer";
      }
    }
  } else {
    // 新規
    if (seat === "black" && !_.black) {
      finalToken = generateToken();
      _.black = finalToken;
      _.step = 0;
      role = "black";
    } else if (seat === "white" && !_.white) {
      finalToken = generateToken();
      _.white = finalToken;
      _.step = 0;
      role = "white";
    } else {
      finalToken = generateToken();
      _.observers.push(finalToken);
      role = "observer";
    }
  }

  // ステータス更新
  if (_.black && _.white) {
    _.status = "black";
    _.boardData = _.legalBoard("black");
  } else {
    _.status = "waiting";
    _.boardData = _.defaultBoard();
  }

  return { role, token: finalToken };
}