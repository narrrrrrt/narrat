//let seat = "";
let seat = new URLSearchParams(location.search).get("seat") || "observer";
const gameId = new URLSearchParams(location.search).get("id") || "1";
let didInit = false;
let currentToken = null;
let hbTimer = null;
let i18n = {};
let lang = "en";

// ===== i18n 読み込み =====
async function loadI18n() {
  const res = await fetch("/i18n/i18n.json");
  i18n = await res.json();

  const params = new URLSearchParams(location.search);
  lang = params.get("lang") || navigator.language.slice(0,2);
  if (!i18n[lang]) lang = "en";
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
  modal.classList.remove("hidden");
  document.getElementById("modalOk").innerText = t("ok");
  document.getElementById("modalOk").onclick = () => {
    modal.classList.add("hidden");
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
        td.innerText = "●";
        td.className = "black";
      } else if (cell === "W") {
        td.innerText = "●";
        td.className = "white";
      } else if (cell === "*" && showMoves) {
        td.innerText = "●";
        td.className = "move";
        hasMove = true;
      } else {
        td.innerText = " ";
        td.className = "";
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
function handleMove(hasMove, data) {
  const flatBoard = data.board.join("");

  // 1. 両者とも合法手がない → 終了
  if (!flatBoard.includes("*")) {
    endGame(flatBoard);
    return;
  }

  // 2. 盤面が完全に埋まっている（- も * も無い） → 終了
  if (!/[-*]/.test(flatBoard)) {
    endGame(flatBoard);
    return;
  }

  // 3. 自分のターンで合法手がない → パス
  if (!hasMove && seat === data.status) {
    showModal(t("no_moves"), () => {
      doPost("move", { x: 3, y: 3, token: currentToken });
    });
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
        //t("you_observer") + " (token=" + currentToken + ")";

      // ハートビート開始（最初のJoin時だけ）
      if (!hbTimer) {
        hbTimer = setInterval(()=>doPost("hb", {token:currentToken}),1000);
      }

    } 
  } else if (json.error) {
    showModal(json.error);
  }
}

function scheduleRetry(data) {
  setTimeout(function check() {
    //log("retry: token=" + currentToken + " step=" + data.step);
    if (currentToken) {
      renderBoard(data);
      //currentStep = data.step;
      // 処理が終わったので何もしない（タイマーはここで終わる）
    } else {
      // まだ追いついてない → 同じ data を引数で再試行
      scheduleRetry(data);
    }
  }, 200);
}

function log(msg) {
  const logDiv = document.getElementById("debugLog") || (() => {
    const d = document.createElement("div");
    d.id = "debugLog";
    d.style.whiteSpace = "pre";
    d.style.fontSize = "12px";
    document.body.appendChild(d);
    return d;
  })();
  logDiv.textContent += msg + "\n";
}


// ==== 即時実行で初期化 ====
(async () => {
  await loadI18n();

  document.getElementById("title").innerText = t("title",{room:gameId});
  document.getElementById("lobbyBtn").innerText = t("lobby");
  document.getElementById("hbStart").innerText = t("hb_start");
  document.getElementById("hbStop").innerText  = t("hb_stop");

  // ロビーへ
  document.getElementById("lobbyBtn").onclick = async ()=>{
    if (currentToken) await doPost("leave",{token:currentToken});
    location.href="/";
  };

  // SSE
  const sse = new EventSource(`/${gameId}/sse`);
  
  sse.addEventListener("init", e => {
    // 中身は空でも捨てずに読んでおく
    //log("init event received: " + e.data);
    if (!didInit) {
      didInit = true;
      doPost("join", { seat: seat });
    } 
  });
  sse.addEventListener("pulse", e => {
    // デバッグ用に表示してもいいし、無視してもいい
    //log("pulse event received");
  });
    // resetイベント
  sse.addEventListener("reset", e => {
    //log("reset event received: " + e.data);
    // 今回は描画処理はなし（サーバー側のデバッグ用フラッシュだから）
  });
  
  sse.addEventListener("join",e=>{
    //log("join event received: " + e.data);
    const data=JSON.parse(e.data);
    //renderBoard(data);
    scheduleRetry(data);
  });
  sse.addEventListener("move",e=>{
    const data=JSON.parse(e.data);
    const hasMove=renderBoard(data);
    requestAnimationFrame(()=>handleMove(hasMove,data));
  });
  sse.addEventListener("leave",e=>{
    const data=JSON.parse(e.data);
    renderBoard(data);
    if (seat && data[seat]===true) {
      showModal(t("leave"),async()=>{
        if (currentToken) {
          await doPost("leave",{token:currentToken});
          await doPost("join",{seat:seat});
        }
      });
    } 
  });

  // 自動 join
  //doPost("join",{seat:seat});
})();