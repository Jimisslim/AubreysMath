
const CONFIG = {
  R2_BASE_URL: "https://pub-2dde85ab527a45a2bd811334ebc482e4.r2.dev",
};

const CATALOG = [
  { id: 1, type: "tv", title: "Jojo's Bizzare Adventure (TV)", year: 2012, genre: "Anime", file: "moviesandtv/Shows/JoJos/JoJo - S01E01.mkv", poster: "" },
  { id: 2, type: "movie", title: "Lego Batman", year: 2017, genre: "Lego",  file: "movies/low-tide.mp4",  poster: "" },
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
  return `${CONFIG.R2_BASE_URL.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}

function render(){
  const filtered = CATALOG.filter(item => {
    const matchesType = activeFilter === "all" || item.type === activeFilter;
    const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase());
    return matchesType && matchesQuery;
  });

  resultCount.textContent = `${filtered.length} title${filtered.length === 1 ? "" : "s"}`;
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
          <svg viewBox="0 0 24 24" fill="none" stroke="#e0a835" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z" fill="#e0a835"/></svg>
        </div>
      </div>
      <div class="meta">
        <div class="title">${item.title}</div>
        <div class="sub">${item.year} · ${item.genre}</div>
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
  modalBody.textContent = `${item.year} · ${item.genre}`;

  const url = buildUrl(item.file);
  if (url){
    playerWrap.innerHTML = `<video src="${url}" controls autoplay></video>`;
  } else {
    playerWrap.innerHTML = `
      <div class="placeholder">
        No Cloudflare bucket connected yet. Once <code>R2_BASE_URL</code> is set
        in the config and <code>${item.file}</code> exists in the bucket, this
        will stream automatically.
      </div>`;
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