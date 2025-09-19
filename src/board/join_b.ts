import { Room, Seat } from "../core/Room";
import { JoinResult } from "../core/Types";

// ★ トークン生成関数はここに閉じ込める
function generateToken(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function join(_: Room, token?: string, seat?: Seat): JoinResult {
  let finalToken: string;

  // === リロード (seat + token 一致) ===
  if (token && seat) {
    if ((seat === "black" && _.black === token) ||
        (seat === "white" && _.white === token)) {
      // リロード → 状態はそのまま
      return { role: seat, token };
    } else {
      // token と seat が不一致 → observer
      finalToken = generateToken();
      _.observers.push(finalToken);
      return { role: "observer", token: finalToken };
    }
  }

  // === リセット (token のみ) ===
  if (token && !seat) {
    if (_.black === token) {
      _.boardData = _.defaultBoard();
      _.status = "waiting";
      _.step = 0;
      return { role: "black", token };
    } else if (_.white === token) {
      _.boardData = _.defaultBoard();
      _.status = "waiting";
      _.step = 0;
      return { role: "white", token };
    } else {
      finalToken = generateToken();
      _.observers.push(finalToken);
      return { role: "observer", token: finalToken };
    }
  }

  // === 新規 (seat のみ) ===
  if (!token && seat) {
    if (seat === "black" && !_.black) {
      finalToken = generateToken();
      _.black = finalToken;
      _.step++;
      if (_.black && _.white) {
        _.status = "black";
        _.boardData = _.legalBoard("black");
      } else {
        _.status = "waiting";
        _.boardData = _.defaultBoard();
      }
      return { role: "black", token: finalToken };
    } else if (seat === "white" && !_.white) {
      finalToken = generateToken();
      _.white = finalToken;
      _.step++;
      if (_.black && _.white) {
        _.status = "black";
        _.boardData = _.legalBoard("black");
      } else {
        _.status = "waiting";
        _.boardData = _.defaultBoard();
      }
      return { role: "white", token: finalToken };
    } else {
      finalToken = generateToken();
      _.observers.push(finalToken);
      return { role: "observer", token: finalToken };
    }
  }

  // === デフォルト (fallback: seat/token 不明) ===
  finalToken = generateToken();
  _.observers.push(finalToken);
  return { role: "observer", token: finalToken };
}