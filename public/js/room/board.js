import { move } from "./api.js";

export function applyBoard(data, role, btnMove, roomId, token) {
  const { step, board, status } = data;

  let displayBoard = board;
  if (Array.isArray(board) && typeof board[0] === "string") {
    // 一次元の string[] を二次元配列に変換
    displayBoard = board.map(row => row.split(""));
  }

  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";

  const pre = document.createElement("pre");
  pre.className = "board";

  renderBoard(pre, displayBoard, status, step, role, roomId, token);

  boardDiv.appendChild(pre);

  const info = document.createElement("div");
  info.textContent = `Step ${step} [status=${status}] (role=${role})`;
  boardDiv.appendChild(info);

  // ボタンの無効化制御
  if (btnMove) {
    btnMove.disabled = role !== status;
  }
}

function renderBoard(pre, board, status, step, role, roomId, token) {
  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === "*") {
        if (role === status) {
          const link = document.createElement("a");
          link.href = "#";
          link.textContent = "*";
          link.addEventListener("click", async (e) => {
            e.preventDefault();
            if (!token) {
              console.error("No token, cannot move.");
              return;
            }

            // デバッグログ
            console.log("click MOVE payload", {
              roomId,
              token,
              x: x + 1,
              y: y + 1,
              typeX: typeof (x + 1),
              typeY: typeof (y + 1)
            });

            try {
              const res = await move(roomId, token, Number(x + 1), Number(y + 1));
              console.log("MOVE response:", res);
            } catch (err) {
              console.error("MOVE failed:", err);
            }
          });
          pre.appendChild(link);
        } else {
          pre.appendChild(document.createTextNode("-"));
        }
      } else {
        pre.appendChild(document.createTextNode(cell));
      }
    });
    pre.appendChild(document.createTextNode("\n"));
  });
}