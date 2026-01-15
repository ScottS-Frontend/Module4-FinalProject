"use strict";

/* =====================
   DOM REFERENCES
===================== */
const form = document.getElementById("searchForm");
const searchBox = document.getElementById("searchBox");
const results = document.getElementById("results");
const sortBar = document.getElementById("sortBar");
const sortSelect = document.getElementById("sortSelect");

/* =====================
   STATE
===================== */
let lastMovies = [];

/* =====================
   UTILITIES
===================== */
const createEl = (tag, text = "", className = "") => {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  if (className) el.className = className;
  return el;
};

const clearResults = () => {
  results.innerHTML = "";
};

const showMessage = (msg, type = "info") => {
  clearResults();
  const p = createEl("p", msg, `msg msg--${type}`);
  results.appendChild(p);
};

/* =====================
   SKELETON LOADING
===================== */
function showSkeletons(count = 6) {
  clearResults();
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const card = createEl("div", "", "movie-card skeleton__fade");
    const skeletonImg = createEl("div", "", "skeleton-card");
    const skeletonTitle = createEl("div", "", "skeleton-text");
    const skeletonYear = createEl("div", "", "skeleton-text");
    card.append(skeletonImg, skeletonTitle, skeletonYear);
    fragment.appendChild(card);
  }
  results.appendChild(fragment);
}

/* =====================
   PLACEHOLDER FOR NO POSTER
===================== */
function createNoPoster() {
  const noPoster = createEl("div", "", "no-poster");
  const icon = createEl("div", "🎬", "film-icon");
  const text = createEl("div", "Poster Not Available");
  noPoster.append(icon, text);
  return noPoster;
}

/* =====================
   RENDER MOVIES
===================== */
function renderMovies(movies) {
  clearResults();
  if (!movies.length) return showMessage("No movies to display.", "info");

  const fragment = document.createDocumentFragment();
  const imagePromises = [];

  movies.forEach((movie) => {
    const card = createEl("div", "", "movie-card fade__in");
    let posterDiv;

    if (
      movie.Poster &&
      movie.Poster !== "N/A" &&
      movie.Poster.startsWith("http")
    ) {
      const img = document.createElement("img");
      img.src = movie.Poster;
      img.alt = `${movie.Title} poster`;
      img.loading = "lazy";

      const imgPromise = new Promise((resolve) => {
        img.onload = () => resolve(img);
        img.onerror = () => {
          const noPoster = createNoPoster();
          img.replaceWith(noPoster);
          resolve(noPoster);
        };
      });
      posterDiv = img;
      imagePromises.push(imgPromise);
      card.appendChild(img);
    } else {
      posterDiv = createNoPoster();
      card.appendChild(posterDiv);
    }

    const title = createEl("h3", movie.Title);
    const year = createEl("p", movie.Year);
    card.append(title, year);
    fragment.appendChild(card);
  });

  results.appendChild(fragment);

  Promise.all(imagePromises).then((divs) => {
    const posterHeights = divs.map((el) => el.offsetHeight);
    const maxHeight = Math.max(...posterHeights, 0);
    results.querySelectorAll(".no-poster").forEach((div) => {
      div.style.height = `${maxHeight}px`;
    });
  });
}

/* =====================
   SORTING
===================== */
const sorters = {
  titleAsc: (a, b) => a.Title.localeCompare(b.Title),
  titleDesc: (a, b) => b.Title.localeCompare(a.Title),
  yearAsc: (a, b) => Number(a.Year) - Number(b.Year),
  yearDesc: (a, b) => Number(b.Year) - Number(a.Year),
};

/* =====================
   FETCH MOVIES
===================== */
async function fetchMovies(query) {
  const url = new URL("https://www.omdbapi.com/ ");
  url.search = new URLSearchParams({
    s: query,
    type: "movie",
    apikey: "544e1ad3",
  });

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("HTTP error");
    const data = await response.json();
    if (data.Response === "False") return [];
    return data.Search ?? [];
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

/* =====================
   EVENT LISTENERS
===================== */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = searchBox.value.trim();
  if (!query) return;

  showSkeletons(6);
  const movies = await fetchMovies(query);

  if (movies === null)
    return showMessage("Network error. Please try again.", "error");
  if (movies.length === 0) return showMessage("No movies found.", "error");

  lastMovies = movies;

  document.querySelector(".main").classList.remove("main--spaced");
  document.querySelector(".main").classList.add("main--compact");

  const skeletonCards = document.querySelectorAll(".skeleton__fade");
  skeletonCards.forEach((card) => (card.style.opacity = "0"));

  setTimeout(() => {
    renderMovies(lastMovies);
    sortBar.classList.remove("hidden");
  }, 700);
});

sortSelect.addEventListener("change", () => {
  const key = sortSelect.value;
  if (!key || !sorters[key]) return;
  const sorted = [...lastMovies].sort(sorters[key]);
  renderMovies(sorted);
});

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  toggle.addEventListener("click", () => links.classList.toggle("active"));

  document.getElementById("year").textContent = new Date().getFullYear();
});
