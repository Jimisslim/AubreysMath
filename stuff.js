const CONFIG = {
  R2_BASE_URL: "https://pub-2dde85ab527a45a2bd811334ebc482e4.r2.dev",
  MANIFEST_URL: "manifest.json",
};

let CATALOG = []; // flattened shows + movies, loaded from manifest.json
let activeFilter = "all";
let query = "";

const grid = document.getElementById("grid");
const emptyState = document.getElementById("empty-state");
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

async function loadManifest(){
  try {
    const res = await fetch(CONFIG.MANIFEST_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`manifest.json returned ${res.status}`);
    const data = await res.json();
    CATALOG = [...(data.shows || []), ...(data.movies || [])];
  } catch (err) {
    console.error("Could not load manifest.json:", err);
    CATALOG = [];
  }
  render();
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
        <div class="play"></div>
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
const playerWrap = document.getElementById("player-wrap");
const closeBtn = document.getElementById("modal-close");
const browseWrap = document.getElementById("browse-wrap");
const seasonTabsEl = document.getElementById("season-tabs");
const episodeListEl = document.getElementById("episode-list");

// Plays a video file, attaching a subtitle track if one exists for it.
// Subtitles must be a separate .vtt file (browsers can't expose subtitle
// tracks that are muxed inside the .mkv itself) - see extract-subs.sh.
function playFile(fileKey, subtitleKey){
  const url = buildUrl(fileKey);
  const subUrl = subtitleKey ? buildUrl(subtitleKey) : null;
  playerWrap.innerHTML = `
    <video controls autoplay>
      <source src="${url}">
      ${subUrl ? `<track kind="subtitles" src="${subUrl}" srclang="en" label="English" default>` : ""}
      Your browser can't play this file directly - it may need to be an .mp4 instead of .mkv.
    </video>
  `;
}

function renderEpisodeList(season){
  episodeListEl.innerHTML = "";
  season.episodes.forEach((ep, idx) => {
    const row = document.createElement("div");
    row.className = "episode-item";
    row.textContent = ep.title;
    row.addEventListener("click", () => {
      episodeListEl.querySelectorAll(".episode-item").forEach(el => el.classList.remove("active"));
      row.classList.add("active");
      playFile(ep.file, ep.subtitle);
    });
    episodeListEl.appendChild(row);
    if (idx === 0) row.click(); // auto-play the first episode of the season
  });
}

function openModal(item){
  modalTitle.textContent = item.title;
  playerWrap.innerHTML = "";
  seasonTabsEl.innerHTML = "";
  episodeListEl.innerHTML = "";

  const isShow = item.type === "tv" && Array.isArray(item.seasons) && item.seasons.length > 0;

  if (isShow){
    browseWrap.style.display = "block";
    item.seasons.forEach((season, idx) => {
      const btn = document.createElement("button");
      btn.textContent = season.label || `Season ${season.season}`;
      btn.className = idx === 0 ? "active" : "";
      btn.addEventListener("click", () => {
        seasonTabsEl.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderEpisodeList(season);
      });
      seasonTabsEl.appendChild(btn);
    });
    renderEpisodeList(item.seasons[0]);
  } else {
    browseWrap.style.display = "none";
    playFile(item.file, item.subtitle);
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

loadManifest();