const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const searchInput = document.getElementById("search");
const sourceSelect = document.getElementById("source");

const viewGridBtn = document.getElementById("view-grid");
const viewListBtn = document.getElementById("view-list");
const colSlider = document.getElementById("col-size");
const colSliderContainer = document.getElementById("col-slider-container");
const themeSelect = document.getElementById("theme-select");

let allLinks = [];

let savedCols = parseInt(localStorage.getItem("ext_cols")) || 5;
if (savedCols > 6) savedCols = 6;
if (savedCols < 2) savedCols = 2;

const CONFIG = {
    view: localStorage.getItem("ext_view") || "grid",
    cols: savedCols ,
    source: localStorage.getItem("ext_source") || "bar",
    theme: localStorage.getItem("ext_theme") || "light"
};

function initUI() {
    document.body.setAttribute("data-theme", CONFIG.theme);
    themeSelect.value = CONFIG.theme;
    sourceSelect.value = CONFIG.source;

    applyViewMode(CONFIG.view);

    colSlider.value = CONFIG.cols;
    updateGridColumns(CONFIG.cols);
}

function applyViewMode(mode) {
    grid.setAttribute("data-view", mode);
    CONFIG.view = mode;
    localStorage.setItem("ext_view", mode);

    if (mode === "grid") {
        viewGridBtn.classList.add("active");
        viewListBtn.classList.remove("active");
        colSliderContainer.classList.remove("hidden");
    } else {
        viewGridBtn.classList.remove("active");
        viewListBtn.classList.add("active");
        colSliderContainer.classList.add("hidden");
    }
}

function updateGridColumns(count) {
    document.documentElement.style.setProperty("--col-count", count);
    CONFIG.cols = count;
    localStorage.setItem("ext_cols", count);
}

viewGridBtn.addEventListener("click", () => applyViewMode("grid"));
viewListBtn.addEventListener("click", () => applyViewMode("list"));

colSlider.addEventListener("input", (e) => {
    updateGridColumns(e.target.value);
});

themeSelect.addEventListener("change", (e) => {
    const selectedTheme = e.target.value;
    document.body.setAttribute("data-theme", selectedTheme);
    CONFIG.theme = selectedTheme;
    localStorage.setItem("ext_theme", selectedTheme);
});

sourceSelect.addEventListener("change", (e) => {
    CONFIG.source = e.target.value;
    localStorage.setItem("ext_source", CONFIG.source);
    load();
});

function isLink(node) {
    return node && node.url && typeof node.url === "string";
}

function flatten(nodes, out = []) {
    for (const n of nodes) {
        if (isLink(n)) out.push(n);
        if (n.children) flatten(n.children, out);
    }
    return out;
}

function getDisplayTitle(item) {
    const t = (item.title || "").trim();
    if (t.length) return t;
    try {
        return new URL(item.url).hostname.replace(/^www\./, "");
    } catch {
        return item.url;
    }
}

function faviconUrl(pageUrl) {
    return `https://www.google.com/s2/favicons?domain=${pageUrl}&sz=64`;
}

function createCard(item) {
    const div = document.createElement("div");
    div.className = "card";
    div.title = item.url;

    const img = document.createElement("img");
    img.className = "icon";

    try {
        img.src = faviconUrl(new URL(item.url).hostname);
    } catch {
        img.src = "";
    }
    img.alt = "";

    img.onerror = () => {
        img.onerror = null;
        const letter = getDisplayTitle(item).slice(0, 1).toUpperCase() || "?";
        img.src = `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="12" fill="%23E5E7EB"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="32" fill="%23374151">${letter}</text></svg>`;
    };

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = getDisplayTitle(item);

    div.appendChild(img);
    div.appendChild(title);

    div.addEventListener("click", () => chrome.tabs.update({ url: item.url }));

    return div;
}

function render(list) {
    grid.innerHTML = "";
    if (!list.length) {
        empty.classList.remove("hidden");
        return;
    }
    empty.classList.add("hidden");

    const frag = document.createDocumentFragment();
    for (const item of list) {
        frag.appendChild(createCard(item));
    }
    grid.appendChild(frag);
}

function applyFilter() {
    const q = (searchInput.value || "").toLowerCase().trim();
    const filtered = !q
        ? allLinks
        : allLinks.filter((b) =>
            (b.title || "").toLowerCase().includes(q) ||
            (b.url || "").toLowerCase().includes(q)
        );

    render(filtered);
}

searchInput.addEventListener("input", applyFilter);

async function getBookmarksBarLinks() {
    return new Promise((resolve) => {
        chrome.bookmarks.getTree((tree) => {
            const root = tree?.[0];
            const bar = root?.children?.[0];
            const links = bar?.children ? flatten(bar.children) : [];
            resolve(links);
        });
    });
}

async function getAllLinks() {
    return new Promise((resolve) => {
        chrome.bookmarks.getTree((tree) => {
            resolve(flatten(tree));
        });
    });
}

async function load() {
    allLinks = CONFIG.source === "bar"
        ? await getBookmarksBarLinks()
        : await getAllLinks();

    applyFilter();
}

function updateClock() {
    const clockElement = document.getElementById('clock');
    if (!clockElement) return;

    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;

    minutes = minutes < 10 ? '0' + minutes : minutes;

    clockElement.textContent = `${hours}:${minutes} ${ampm}`;
}

updateClock();
setInterval(updateClock, 1000);
initUI();
load();