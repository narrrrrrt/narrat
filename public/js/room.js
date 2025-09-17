let seat = "";
let currentToken = null;
let hbTimer = null;
let i18n = {};
let lang = "en";
alert(1);
// ===== i18n 読み込み =====
async function loadI18n() {
  const res = await fetch("/i18n/i18n.json");
  i18n = await res.json();

  const params = new URLSearchParams(location.search);
  lang = params.get("lang") || navigator.language.slice(0,2);
  if (!i18n[lang]) lang = "en";
}
function t(key, vars={}) {
  let text = i18n[lang][key] || key;
  for (const [k,v] of Object.entries(vars)) {
    text = text.replace(`{{${k}}}`, v);
  }
  return text;
}

// ===== モーダル =====
function showModal(msg, callback) {
  document.getElementById("modalText").innerText = msg;
  const modal = document.getElementById("modal");
  modal.classList.remove("hidden");
  document.getElementById("modalOk").onclick = () => {
    modal.classList.add("hidden");
    if (callback) callback();
  };
}

// ===== ボード描画 =====
function renderBoard(data) {
  document.getElementById("status").innerText = {
    black: t("status_black"),
    white: t("status_white"),
    waiting: t("status_waiting"),
    leave: t("status_leave")
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
        td.innerText = "●";
        td.className = "black";
      } else if (cell === "W") {
        td.innerText = "○";
        td.className = "white";
      } else if (cell === "*" && showMoves) {
        td.innerText = "●";
        td.className = "move";
        hasMove = true;
      } else {
        td.innerText = " ";
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
  let msg = t("game_end",{b:blackCount,w:whiteCount});
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
        (seat==="black"?t("you_black"):t("you_white"));
    }
  } else if (json.error) {
    showModal(json.error);
  }
}

// ===== 初期化 =====
const params = new URLSearchParams(location.search);
const gameId = params.get("id") || "1";

//window.onload = async () => {
alert(2);

  //await loadI18n();
alert(3);

  document.getElementById("title").innerText = t("title",{room:gameId});
  document.getElementById("lobbyBtn").innerText = t("lobby");
  document.getElementById("hbStart").innerText = t("hb_start");
  document.getElementById("hbStop").innerText  = t("hb_stop");

  // ロビーへ
  document.getElementById("lobbyBtn").onclick = async ()=>{
    if (currentToken) await doPost("leave",{token:currentToken});
    location.href="/";
  };

  // ハートビート
  document.getElementById("hbStart").onclick = ()=>{
    if (!currentToken) { showModal(t("need_join")); return; }
    hbTimer=setInterval(()=>doPost("hb",{token:currentToken}),10000);
  };
  document.getElementById("hbStop").onclick = ()=>{
    clearInterval(hbTimer);
    hbTimer=null;
  };

  // SSE
  const sse = new EventSource(`/${gameId}/sse`);
  sse.addEventListener("join",e=>{
    const data=JSON.parse(e.data);
    renderBoard(data);
  });
  sse.addEventListener("move",e=>{
    const data=JSON.parse(e.data);
    const hasMove=renderBoard(data);
    requestAnimationFrame(()=>handleMove(hasMove,data));
  });
  sse.addEventListener("leave",e=>{
    const data=JSON.parse(e.data);
    renderBoard(data);
    showModal(t("status_leave"),async()=>{
      if (currentToken) await doPost("leave",{token:currentToken});
    });
  });

  // 自動 join
  doPost("join",{seat:seat});
//};
