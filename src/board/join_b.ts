import { Room, Seat } from "../core/Room";

export function join(_: Room, token: string, seat: Seat): Seat {
  if (seat === "black" && !_.black) {
    _.black = token;
    _.step++;
  } else if (seat === "white" && !_.white) {
    _.white = token;
    _.step++;
  } else {
    // ★ 黒/白の席が埋まっている or observer 指定
    _.observers.push(token);
    return "observer";
  }

  // ★ 黒白両方揃ったら黒ターンで開始
  if (_.black && _.white) {
    _.status = "black";
    _.boardData = _.legalBoard("black");
  } else {
    _.status = "waiting";
    _.boardData = _.defaultBoard();
  }

  return seat;
}