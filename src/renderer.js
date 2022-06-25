const { ipcRenderer } = require('electron');
const { tab } = require("./js/tab");

let urlInput;
let toggleFullscreenButton;
let browserView;
let windowTitle;
let goBackButton;
let goForwardButton;

let currentTab;
let activeTab;

window.addEventListener("DOMContentLoaded", () => {
	toggleFullscreenButton = document.getElementById("toggle-fullscreen");

	document.getElementById("close-window").addEventListener("click", () => { ipcRenderer.send("close-window"); });
	document.getElementById("minimize-window").addEventListener("click", () => { ipcRenderer.send("minimize-window"); });
	toggleFullscreenButton.addEventListener("click", () => { ipcRenderer.send("maximize-window"); });

	document.addEventListener("keydown", (event) => {
		switch (event.key) {
			case "F12":
				ipcRenderer.send("open-dev-tools");
				break;
		}
	});

	urlInput = document.getElementById("url");

	urlInput.addEventListener("keypress", (event) => {
		if (event.key == "Enter") {
			ipcRenderer.send("url-input", urlInput.value);
			defocus();
		}
	});

	urlInput.addEventListener("input", () => {
		// fetch('/suggest?q=' + urlInput.value).then((response) => {
		// 	return response.json();
		// }).then((data) => {
		// 	console.log(data);
		// }).catch((err) => {
		// 	console.warn('Something went wrong.', err);
		// });
	});

	urlInput.addEventListener("focus", () => { urlInput.select(); });
	urlInput.addEventListener("focusout", (event) => { defocus() });

	browserView = document.getElementById("browser-view");
	windowTitle = document.querySelector("title");

	goBackButton = document.getElementById("go-back")
	goForwardButton = document.getElementById("go-forward")

	goBackButton.addEventListener("click", () => { ipcRenderer.send("go-back"); });
	goForwardButton.addEventListener("click", () => { ipcRenderer.send("go-forward"); });

	document.getElementById("reload").addEventListener("click", () => { ipcRenderer.send("reload"); });
	document.getElementById("home").addEventListener("click", () => { ipcRenderer.send("load-homepage"); });

	activeTab = document.querySelector(".tab-list").firstElementChild;

	resizeBrowserview();
});

function defocus() {
	window.getSelection().removeAllRanges();
}

function updateNavigation(canGoBack, canGoForward) {
	console.log("can go back: " + canGoBack);
	console.log("can go forward: " + canGoForward);

	if (canGoBack) {
		goBackButton.classList.remove("disabled");
	} else {
		goBackButton.classList.add("disabled");
	}

	if (canGoForward) {
		goForwardButton.classList.remove("disabled");
	} else {
		goForwardButton.classList.add("disabled");
	}
}

ipcRenderer.on("update-arrow-navigation", (event, navigation) => { updateNavigation(navigation.canGoBack, navigation.canGoForward); });

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
	if (activeTab != null) {
		activeTab.querySelector("#tab-title").textContent = title;
		windowTitle.textContent = title + " - Webzilla";
	}
}

function setPageFavicon(favicon) {
	currentTab.favicon = favicon;
	faviconImage = activeTab.querySelector("#favicon");

	if (favicon != null) {
		faviconImage.src = currentTab.favicon;
		// faviconImage.style.display = "block";
	}
}

function setPageURL(url) {
	if (urlInput != null)
		urlInput.value = currentTab.isWebPage || currentTab.isErrorPage ? url : "webzilla://" + currentPage.title.toLowerCase();
}

ipcRenderer.on("tab-update", (sender, tab) => {
	currentTab = tab;
	console.log(currentTab);

	setPageTitle(currentTab.title);
	setPageURL(currentTab.targetUrl);
});

ipcRenderer.on("page-title-update", (sender, title) => { setPageTitle(title); });
ipcRenderer.on("tab-favicon-update", (sender, favicon) => { setPageFavicon(favicon); });

ipcRenderer.on("page-started-loading", () => { activeTab.classList.add("loading"); });
ipcRenderer.on("page-stopped-loading", () => { activeTab.classList.remove("loading"); });