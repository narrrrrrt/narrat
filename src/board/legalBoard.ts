import { Room } from "../core/Room";

/**
 * legalBoard
 * 現在の盤面に合法手（*）をマーキングして返す
 * @param _ Room インスタンス
 * @param turn 手番 ("black" | "white")
 * @returns 8×8 の文字列配列
 */
export function legalBoard(_: Room, turn: "black" | "white"): string[] {
  const size = 8;
  const board = _.boardData.map(row => row.split("")); // 文字列配列 → 2次元配列

  const me = turn === "black" ? "B" : "W";
  const opp = turn === "black" ? "W" : "B";

  // ★ 古い合法手マークをリセット
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] === "*") {
        board[y][x] = "-";
      }
    }
  }

  // 8方向
  const directions = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];

  // 全マス走査
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] !== "-") continue; // 空きマスのみ

      let legal = false;

      for (const [dx, dy] of directions) {
        let nx = x + dx;
        let ny = y + dy;
        let foundOpp = false;

        while (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          if (board[ny][nx] === opp) {
            foundOpp = true;
            nx += dx;
            ny += dy;
            continue;
          }
          if (board[ny][nx] === me && foundOpp) {
            legal = true;
          }
          break;
        }

        if (legal) break; // 1方向でも合法なら即決定
      }

      if (legal) {
        board[y][x] = "*"; // 合法手マーキング
      }
    }
  }

  // 2次元配列 → 文字列配列に戻す
  return board.map(row => row.join(""));
}