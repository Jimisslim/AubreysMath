const fs = require("fs");
const path = require("path");

const ROOT = process.argv[2] || ".";
const VIDEO_EXT = [".mkv", ".mp4"];
const POSTER_EXT = [".jpg", ".jpeg", ".png", ".webp"];

function isVideo(f) { return VIDEO_EXT.includes(path.extname(f).toLowerCase()); }
function isPoster(f) { return POSTER_EXT.includes(path.extname(f).toLowerCase()); }

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function toBucketPath(...parts) {
  return parts.join("/").replace(/\\/g, "/");
}

function findSidecarSubtitle(dirAbs, dirBucket, videoFile) {
  const base = path.basename(videoFile, path.extname(videoFile));
  const vtt = base + ".vtt";
  if (fs.existsSync(path.join(dirAbs, vtt))) {
    return toBucketPath(dirBucket, vtt);
  }
  return null;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildShows(showsRootAbs) {
  const shows = [];
  if (!fs.existsSync(showsRootAbs)) return shows;

  for (const showName of fs.readdirSync(showsRootAbs).sort(naturalSort)) {
    const showAbs = path.join(showsRootAbs, showName);
    if (!fs.statSync(showAbs).isDirectory()) continue;

    const showBucket = toBucketPath("Shows", showName);
    const entries = fs.readdirSync(showAbs);

    const posterFile = entries.find(isPoster);
    const seasonDirs = entries
      .filter(e => fs.statSync(path.join(showAbs, e)).isDirectory())
      .filter(e => /^season\s*\d+$/i.test(e))
      .sort(naturalSort);

    const seasons = seasonDirs.map(seasonName => {
      const seasonAbs = path.join(showAbs, seasonName);
      const seasonBucket = toBucketPath(showBucket, seasonName);
      const seasonNum = parseInt(seasonName.match(/\d+/)[0], 10);

      const episodes = fs.readdirSync(seasonAbs)
        .filter(isVideo)
        .sort(naturalSort)
        .map(epFile => ({
          title: path.basename(epFile, path.extname(epFile)),
          file: toBucketPath(seasonBucket, epFile),
          subtitle: findSidecarSubtitle(seasonAbs, seasonBucket, epFile)
        }));

      return { season: seasonNum, label: `Season ${seasonNum}`, episodes };
    });

    shows.push({
      id: slugify(showName),
      type: "tv",
      title: showName,
      year: null,
      genre: "",
      poster: posterFile ? toBucketPath(showBucket, posterFile) : null,
      seasons
    });
  }
  return shows;
}

function buildMovies(moviesRootAbs) {
  const movies = [];
  if (!fs.existsSync(moviesRootAbs)) return movies;

  for (const file of fs.readdirSync(moviesRootAbs).sort(naturalSort)) {
    const abs = path.join(moviesRootAbs, file);
    if (!fs.statSync(abs).isFile() || !isVideo(file)) continue;

    const title = path.basename(file, path.extname(file));
    movies.push({
      id: slugify(title),
      type: "movie",
      title,
      year: null,
      genre: "",
      poster: null,
      file: toBucketPath("Movies", file),
      subtitle: findSidecarSubtitle(moviesRootAbs, "Movies", file)
    });
  }
  return movies;
}

const OUTPUT_FILE = process.argv[3] || "manifest.json";

const shows = buildShows(path.join(ROOT, "Shows"));
const movies = buildMovies(path.join(ROOT, "Movies"));

const manifest = { shows, movies };
// fs.writeFileSync with "utf8" never adds a byte-order-mark, unlike PowerShell's
// ">" redirection sometimes does - this keeps the JSON valid for fetch()/JSON.parse().
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(`Found ${shows.length} show(s) and ${movies.length} movie(s).`);
console.log(`Wrote ${OUTPUT_FILE}`);