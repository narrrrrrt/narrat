export function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    id: params.get("id"),
    seat: params.get("seat"),
  };
}

export function applyTemplates(id, seat) {
  document.querySelectorAll("[data-template]").forEach(el => {
    el.textContent = el.dataset.template
      .replace("{id}", id)
      .replace("{seat}", seat);
  });
}

export function appendLog(type, msg) {
  const stateLog = document.getElementById("state-log");
  const p = document.createElement("p");
  p.textContent = `[${type}] ${msg}`;
  stateLog.appendChild(p);
}