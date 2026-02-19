// --- DOM Elements ---
const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const searchInput = document.getElementById("search");
const sourceSelect = document.getElementById("source");

const viewGridBtn = document.getElementById("view-grid");
const viewListBtn = document.getElementById("view-list");
const colSlider = document.getElementById("col-size");
const colSliderContainer = document.getElementById("col-slider-container");
const themeSelect = document.getElementById("theme-select");

// Account Elements
const accountBtn = document.getElementById("active-account-btn");
const accountDropdown = document.getElementById("account-dropdown");

// Modal Elements
const modal = document.getElementById("shortcut-modal");
const saveShortcutBtn = document.getElementById("save-shortcut");
const cancelShortcutBtn = document.getElementById("cancel-shortcut");
const nameInput = document.getElementById("shortcut-name");
const urlInput = document.getElementById("shortcut-url");

let allLinks = [];

// --- Config / Persistence ---
let savedCols = parseInt(localStorage.getItem("ext_cols")) || 5;
if (savedCols > 6) savedCols = 6;
if (savedCols < 2) savedCols = 2;

const CONFIG = {
    view: localStorage.getItem("ext_view") || "grid",
    cols: savedCols,
    source: localStorage.getItem("ext_source") || "bar",
    theme: localStorage.getItem("ext_theme") || "light"
};

const defaultShortcuts = [
    { name: "YouTube", url: "https://youtube.com" },
    { name: "Gmail", url: "https://mail.google.com" },
    { name: "GitHub", url: "https://github.com" },
    { name: "ChatGPT", url: "https://chatgpt.com" },
    { name: "Twitter", url: "https://x.com" }
];

let shortcutsData = JSON.parse(localStorage.getItem('ext_user_shortcuts')) || defaultShortcuts;

// --- Initialization ---
function initUI() {
    document.body.setAttribute("data-theme", CONFIG.theme);
    themeSelect.value = CONFIG.theme;
    sourceSelect.value = CONFIG.source;

    applyViewMode(CONFIG.view);
    colSlider.value = CONFIG.cols;
    updateGridColumns(CONFIG.cols);

    renderShortcuts();
}

// --- Shortcuts Logic ---
function renderShortcuts() {
    const container = document.getElementById("shortcuts-container");
    if (!container) return;
    container.innerHTML = "";

    shortcutsData.forEach(sc => {
        const a = document.createElement("a");
        a.className = "shortcut-item";
        a.href = sc.url;
        a.title = sc.name;

        const wrapper = document.createElement("div");
        wrapper.className = "shortcut-icon-wrapper";

        const img = document.createElement("img");
        try {
            img.src = faviconUrl(new URL(sc.url).hostname);
        } catch {
            img.src = "";
        }

        img.onerror = () => {
            img.onerror = null;
            const letter = sc.name.slice(0, 1).toUpperCase();
            img.src = `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="32" fill="%23374151">${letter}</text></svg>`;
        };

        const label = document.createElement("span");
        label.className = "shortcut-label";
        label.textContent = sc.name;

        wrapper.appendChild(img);
        a.appendChild(wrapper);
        a.appendChild(label);
        container.appendChild(a);
    });

    // Add "+" Button
    const addBtn = document.createElement("a");
    addBtn.className = "shortcut-item add-shortcut-btn";

    const addWrapper = document.createElement("div");
    addWrapper.className = "shortcut-icon-wrapper";
    addWrapper.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

    const addLabel = document.createElement("span");
    addLabel.className = "shortcut-label";
    addLabel.textContent = "Add shortcut";

    addBtn.appendChild(addWrapper);
    addBtn.appendChild(addLabel);

    addBtn.addEventListener("click", () => {
        nameInput.value = "";
        urlInput.value = "";
        modal.classList.remove("hidden");
        nameInput.focus();
    });

    container.appendChild(addBtn);
}

// Modal Listeners
function closeShortcutModal() {
    modal.classList.add("hidden");
}

cancelShortcutBtn.addEventListener("click", closeShortcutModal);

modal.addEventListener("click", (e) => {
    if (e.target === modal) closeShortcutModal();
});

saveShortcutBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();

    if (!name || !url) return;

    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    shortcutsData.push({ name, url });
    localStorage.setItem('ext_user_shortcuts', JSON.stringify(shortcutsData));

    renderShortcuts();
    closeShortcutModal();
});

// --- UI Logic ---
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

// --- Event Listeners ---
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

// --- Account Dropdown Logic ---
if (accountBtn && accountDropdown) {
    accountBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        accountDropdown.classList.toggle("hidden");

        const chevron = accountBtn.querySelector(".chevron");
        if (accountDropdown.classList.contains("hidden")) {
            chevron.style.transform = "rotate(0deg)";
        } else {
            chevron.style.transform = "rotate(180deg)";
        }
    });

    document.addEventListener("click", (e) => {
        if (!accountDropdown.contains(e.target) && !accountDropdown.classList.contains("hidden")) {
            accountDropdown.classList.add("hidden");
            accountBtn.querySelector(".chevron").style.transform = "rotate(0deg)";
        }
    });
}

// --- Google Identity Fetcher ---
function fetchGoogleAccount() {
    if (chrome && chrome.identity && chrome.identity.getProfileUserInfo) {
        chrome.identity.getProfileUserInfo({ accountStatus: "ANY" }, (userInfo) => {
            if (userInfo && userInfo.email) {
                const email = userInfo.email;
                const name = email.split('@')[0];

                document.getElementById('main-account-name').textContent = name;
                document.getElementById('main-avatar').src = `https://ui-avatars.com/api/?name=${name}&background=2563eb&color=fff`;

                document.getElementById('dropdown-name').textContent = name;
                document.getElementById('dropdown-email').textContent = email;
                document.getElementById('dropdown-avatar').src = `https://ui-avatars.com/api/?name=${name}&background=2563eb&color=fff`;
            }
        });
    }
}

// --- Bookmark Utility Functions ---
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

// --- Card Generation ---
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

// --- Rendering & Filtering ---
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

// --- Fetching Data ---
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

// --- Clock Logic ---
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

// --- Bootstrap ---
updateClock();
setInterval(updateClock, 1000);
fetchGoogleAccount();
initUI();
load();