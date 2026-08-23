const CONFIG = {
  R2_BASE_URL: "https://pub-2dde85ab527a45a2bd811334ebc482e4.r2.dev",
};

const CATALOG = [
  { id: 1, type: "tv", title: "Jojo's Bizzare Adventure (TV)", year: 2012, genre: "Anime", file: "Shows/JoJos/JoJo - S01E01-fixed.mp4", poster: "poser.png" },
];


let activeFilter = "all";
let query = "";

const grid = document.getElementById("grid");
const emptyState = document.getElementById("empty-state");
const resultCount = document.getElementById("result-count");
const tabs = document.getElementById("tabs");
const searchInput = document.getElementById("search");

function buildUrl(key){
  if (!key) return "";
  if (!CONFIG.R2_BASE_URL) return "";
  const encodedKey = key
    .replace(/^\//, "")
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  return `${CONFIG.R2_BASE_URL.replace(/\/$/, "")}/${encodedKey}`;
}
function render(){
  const filtered = CATALOG.filter(item => {
    const matchesType = activeFilter === "all" || item.type === activeFilter;
    const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase());
    return matchesType && matchesQuery;
  });


  grid.innerHTML = "";

  if (filtered.length === 0){
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="poster" style="${item.poster ? `background-image:url('${buildUrl(item.poster)}');background-size:cover;background-position:center;` : ""}">
        ${item.poster ? "" : item.title}
        <div class="play">
        </div>
      </div>
      <div class="meta">
        <div class="title">${item.title}</div>
      </div>
    `;
    card.addEventListener("click", () => openModal(item));
    grid.appendChild(card);
  });
}

tabs.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  tabs.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  activeFilter = btn.dataset.filter;
  render();
});

searchInput.addEventListener("input", (e) => {
  query = e.target.value;
  render();
});


const backdrop = document.getElementById("modal-backdrop");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const playerWrap = document.getElementById("player-wrap");
const closeBtn = document.getElementById("modal-close");

function openModal(item){
  modalTitle.textContent = item.title;

  const url = buildUrl(item.file);
  if (url){
    playerWrap.innerHTML = `<video src="${url}" controls autoplay></video>`;
  } else {
  }
  backdrop.classList.add("open");
}

function closeModal(){
  backdrop.classList.remove("open");
  playerWrap.innerHTML = ""; 
}

closeBtn.addEventListener("click", closeModal);
backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

render();