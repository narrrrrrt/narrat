import { move } from "./api.js";
export function applyBoard(data, role, btnMove, roomId, token) {
  const { step, board, status } = data;

  btnMove.disabled = (role !== status);

  let displayBoard = board;
  if (Array.isArray(board) && typeof board[0] === "string") {
    displayBoard = board.map(row => row.split(""));
  }

  renderBoard(displayBoard, status, step, role, roomId, token);
}

export function renderBoard(board, status, step, role, roomId, token) {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";

  const info = document.createElement("p");
  info.textContent = `Step ${step} [status=${status}] (role=${role})`;
  boardDiv.appendChild(info);

  if (Array.isArray(board)) {
    const pre = document.createElement("pre");

    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === "*") {
          if (role === status) {
            // 自分のターン → クリック可能リンク
            const link = document.createElement("a");
            link.href = "#";
            link.textContent = "*";
            link.style.color = "blue";
            link.style.textDecoration = "underline";

            link.addEventListener("click", async (e) => {
              e.preventDefault();
              if (!token) {
                console.error("No token, cannot move.");
                return;
              }
              try {
                const res = await move(roomId, token, x + 1, y + 1);
                console.log("MOVE response:", res);
              } catch (err) {
                console.error("MOVE failed:", err);
              }
            });

            pre.appendChild(link);
          } else {
            // 相手ターン → 「-」表示
            pre.appendChild(document.createTextNode("-"));
          }
        } else {
          // 普通のマス（石 or 空白）
          pre.appendChild(document.createTextNode(cell));
        }
      });
      pre.appendChild(document.createTextNode("\n"));
    });

    boardDiv.appendChild(pre);
  }
}