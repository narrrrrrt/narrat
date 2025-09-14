export function applyBoard(data, role, btnMove) {
  const { step, board, status } = data;

  // 自分の番以外は MOVE ボタンを無効化
  btnMove.disabled = (role !== status);

  let displayBoard = board;

  // ★ 追加: 一次元文字列配列を二次元配列に変換
  if (Array.isArray(board) && typeof board[0] === "string") {
    displayBoard = board.map(row => row.split(""));
  }

  if (Array.isArray(displayBoard)) {
    displayBoard = displayBoard.map(row =>
      row.map(cell =>
        (cell === "*" && role !== status) ? "-" : cell
      )
    );
  }

  renderBoard(displayBoard, status, step, role);
}

export function renderBoard(board, status, step, role) {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";

  const info = document.createElement("p");
  info.textContent = `Step ${step} [status=${status}] (role=${role})`;
  boardDiv.appendChild(info);

  if (Array.isArray(board)) {
    const table = document.createElement("table");
    for (let y = 0; y < board.length; y++) {
      const tr = document.createElement("tr");
      for (let x = 0; x < board[y].length; x++) {
        const td = document.createElement("td");
        td.textContent = board[y][x];
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    boardDiv.appendChild(table);
  }
}