const { ipcRenderer, webContents } = require('electron');

let urlInput;
let closeWindowButton;
let minimizeWindowButton;
let toggleFullscreenButton;
let browserView;
let title;
let reloadButton;
let homeButton;

let activeTab;

window.addEventListener("DOMContentLoaded", () => {
	closeWindowButton = document.getElementById("close-window")
	minimizeWindowButton = document.getElementById("minimize-window")
	toggleFullscreenButton = document.getElementById("toggle-fullscreen")

	closeWindowButton.addEventListener("click", () => { ipcRenderer.send("close-window"); });
	minimizeWindowButton.addEventListener("click", () => { ipcRenderer.send("minimize-window"); });
	toggleFullscreenButton.addEventListener("click", () => { ipcRenderer.send("maximize-window"); });

	urlInput = document.getElementById("url");

	urlInput.addEventListener("keypress", (event) => {
		if (event.key == "Enter") {
			ipcRenderer.send("url-input", urlInput.value);
		}
	});

	urlInput.addEventListener("focus", () => { urlInput.select(); });

	urlInput.addEventListener("focusout", (event) => {
		window.getSelection().removeAllRanges();
	});

	browserView = document.getElementById("browser-view");
	title = document.getElementById("title");

	reloadButton = document.getElementById("reload");
	homeButton = document.getElementById("home");

	reloadButton.addEventListener("click", () => { ipcRenderer.send("reload"); });
	homeButton.addEventListener("click", () => { ipcRenderer.send("load-homepage"); });

	activeTab = document.querySelector(".tab-list").firstElementChild;

	resizeBrowserview();
});

ipcRenderer.on("toggled-fullscreen", (event, isFullscreen) => {
	toggleFullscreenButton.firstChild.classList.remove(isFullscreen ? "fa-expand" : "fa-compress");
	toggleFullscreenButton.firstChild.classList.add(isFullscreen ? "fa-compress" : "fa-expand");
});

function resizeBrowserview() {
	const bounds = browserView.getBoundingClientRect();
	ipcRenderer.send("resize-browserview", { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
}

window.addEventListener("resize", () => {
	resizeBrowserview();
});

function setPageTitle(title) {
	activeTab.querySelector("#tab-title").textContent = title;
	title.textContent = title + " - Webzilla";
}

function setPageFavicon(favicons) {
	activeTab.querySelector("#favicon").src = favicons[0];
}

function setPageURL(url) {
	urlInput.value = url;
}

ipcRenderer.on("page-update", (sender, page) => {
	setPageTitle(page.title);
	setPageURL(page.url);
});

ipcRenderer.on("page-title-update", (sender, title) => { setPageTitle(title); });
ipcRenderer.on("page-favicon-update", (sender, favicons) => { setPageFavicon(favicons); });

ipcRenderer.on("page-started-loading", () => { activeTab.classList.add("loading") });
ipcRenderer.on("page-stopped-loading", () => { activeTab.classList.remove("loading") });