class LobbyRoom {
  constructor(id) {
    this.id = id; // "1", "2", "3", ...
    this.root = document.getElementById(id);

    this.btnBlack = this.root.querySelector(".button-black");
    this.btnWhite = this.root.querySelector(".button-white");
  }

  async init() {
    await this.fetchStatus();
    this.startSSE();
  }

  async fetchStatus() {
    try {
      const res = await fetch(`/${this.id}/status`);
      const data = await res.json();
      this.updateButtons(data.black, data.white);
    } catch (err) {
      // エラー時は無視
    }
  }

  updateButtons(black, white) {
    if (black) {
      this.btnBlack.classList.add("disabled");
    } else {
      this.btnBlack.classList.remove("disabled");
    }

    if (white) {
      this.btnWhite.classList.add("disabled");
    } else {
      this.btnWhite.classList.remove("disabled");
    }
  }

  startSSE() {
    const es = new EventSource(`/${this.id}/sse`);
    es.addEventListener("join", (event) => this.handleSSE(event));
    es.addEventListener("leave", (event) => this.handleSSE(event));
  }

  handleSSE(event) {
    try {
      const data = JSON.parse(event.data);
      this.updateButtons(data.black, data.white);
    } catch (e) {
      // データ不正時は無視
    }
  }
}

window.onload = () => {
  const roomIds = ["1", "2", "3", "4"];
  roomIds.forEach(id => {
    const room = new LobbyRoom(id);
    room.init();
  });
};