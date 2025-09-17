let seat = new URLSearchParams(location.search).get("seat") || "observer";
const gameId = new URLSearchParams(location.search).get("id") || "1";
let currentToken = null;
let hbTimer = null;
let i18n = {};
let lang = "en";
let lastData = null;

// ===== i18n 読み込み =====
async function loadI18n() {
  const res = await fetch("/i18n/i18n.json");
  i18n = await res.json();

  const params = new URLSearchParams(location.search);
  lang = params.get("lang") || navigator.language.slice(0,2);
  if (!i18n["game_over"][lang]) lang = "en";
}

function t(key, vars = {}) {
  let text = (i18n[key] && i18n[key][lang]) || key;
  for (const [k,v] of Object.entries(vars)) {
    text = text.replace(`{{${k}}}`, v);
  }
  return text;
}

// ===== モーダル =====
function showModal(msg, callback) {
  document.getElementById("modalText").innerText = msg;
  const modal = document.getElementById("modal");
  modal.style.display = "flex";
  document.getElementById("modalOk").innerText = t("ok");
  document.getElementById("modalOk").onclick = () => {
    modal.style.display = "none";
    if (callback) callback();
  };
}

// ===== ボード描画 =====
function renderBoard(data) {
  document.getElementById("status").innerText = {
    black: t("turn_black"),
    white: t("turn_white"),
    waiting: t("waiting"),
    leave: t("leave")
  }[data.status] || "";

  const showMoves = (seat === data.status);
  let hasMove = false;

  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";
  const table = document.createElement("table");

  data.board.forEach((row,y) => {
    const tr = document.createElement("tr");
    row.split("").forEach((cell,x) => {
      const td = document.createElement("td");

      if (cell === "B") {
        const stone = document.createElement("div");
        stone.className = "stone black";
        td.appendChild(stone);
      } else if (cell === "W") {
        const stone = document.createElement("div");
        stone.className = "stone white";
        td.appendChild(stone);
      } else if (cell === "*" && showMoves) {
        const move = document.createElement("div");
        move.className = "move";
        td.appendChild(move);
        hasMove = true;
      }

      td.onclick = () => {
        if (!currentToken) { showModal(t("need_join")); return; }
        doPost("move",{x,y,token:currentToken});
      };
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
  boardDiv.appendChild(table);

  return hasMove;
}

// ===== ゲーム終了処理 =====
function endGame(flatBoard) {
  const blackCount = (flatBoard.match(/B/g)||[]).length;
  const whiteCount = (flatBoard.match(/W/g)||[]).length;
  let msg = t("game_over") + `\n${t("you_black")}: ${blackCount} vs ${t("you_white")}: ${whiteCount}`;
  if (blackCount > whiteCount) msg += "\n" + t("black_win");
  else if (whiteCount > blackCount) msg += "\n" + t("white_win");
  else msg += "\n" + t("draw");
  showModal(msg);
}

// ===== move 処理 =====
function handleMove(hasMove,data) {
  const flatBoard = data.board.join("");
  const hasEmpty = /[-*]/.test(flatBoard);

  if (!hasMove) {
    if (!hasEmpty) {
      endGame(flatBoard);
    } else if (seat === data.status) {
      showModal(t("no_moves"),()=>{
        doPost("move",{x:3,y:3,token:currentToken});
      });
    }
  }
}

// ===== POST =====
async function doPost(action,body) {
  const res = await fetch(`/${gameId}/${action}`,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
  const json = await res.json();
  if (json.ok) {
    if (action==="join") {
      currentToken = json.token;
      seat = json.role;
      document.getElementById("seatInfo").innerText =
        seat === "black" ? t("you_black") :
        seat === "white" ? t("you_white") :
        t("you_observer");

      // ハートビート開始（最初だけ）
      if (!hbTimer) {
        hbTimer=setInterval(()=>doPost("hb",{token:currentToken}),1000);
      }

      // もし先に SSE が来て lastData に残ってたら描画
      if (lastData) {
        renderBoard(lastData);
        lastData=null;
      }
    }
  } else if (json.error) {
    showModal(json.error);
  }
}

// ==== 即時実行で初期化 ====
(async () => {
  await loadI18n();

  document.getElementById("title").innerText = t("title",{room:gameId});
  document.getElementById("lobbyBtn").innerText = t("lobby");
  document.getElementById("hbStop").innerText  = t("hb_stop");

  // ロビーへ
  document.getElementById("lobbyBtn").onclick = async ()=>{
    if (currentToken) await doPost("leave",{token:currentToken});
    location.href="/";
  };

  // ハートビート停止
  document.getElementById("hbStop").onclick = ()=>{
    clearInterval(hbTimer);
    hbTimer=null;
  };

  // SSE
  const sse = new EventSource(`/${gameId}/sse`);
  sse.addEventListener("join",e=>{
    const data=JSON.parse(e.data);
    lastData=data;
    if (currentToken) renderBoard(data);
  });
  sse.addEventListener("move",e=>{
    const data=JSON.parse(e.data);
    const hasMove=renderBoard(data);
    requestAnimationFrame(()=>handleMove(hasMove,data));
  });
  sse.addEventListener("leave",e=>{
    const data = JSON.parse(e.data);
    renderBoard(data);
    if (seat && data[seat] === true) {
      showModal(t("leave"), async () => {
        if (currentToken) await doPost("leave",{token:currentToken});
        await doPost("join",{seat:seat});
      });
    }
  });

  // 自動 join
  doPost("join",{seat:seat});
})();