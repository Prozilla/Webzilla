const { app, BrowserWindow, ipcMain, BrowserView, webContents } = require("electron");
const path = require("path");
const { store, load } = require("./js/store");
const { tab } = require("./js/tab");

const homePage = "https://google.com"; // https://google.com
const errorPage = "src/pages/error.html";

let window;
let browserView;

let currentTab;

let currentUrl;
let currentPageIsFile = false;
let failedToLoad = false;
let initialized = false;

const createWindow = () => {
	window = new BrowserWindow({
		width: 1000,
		height: 700,
		frame: false,
		autoHideMenuBar: true,
		webPreferences: {
			webviewTag: true,
			nodeIntegration: true,
			preload: path.join(__dirname, "renderer.js"),
		}
	});

	window.loadFile("src/index.html");
	// window.webContents.openDevTools();

	window.on("maximize", () => { window.webContents.send("toggled-fullscreen", true); });
	window.on("unmaximize", () => { window.webContents.send("toggled-fullscreen", false); });

	browserView = new BrowserView({
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
			webSecurity: false,
		}
	});

	window.addBrowserView(browserView);
	browserView.setBounds({ x: 0, y: 0, width: 300, height: 300 });

	const url = load();

	if (url == null) {
		loadHomePage();
	} else {
		loadPage(url, false);
	}

	browserView.webContents.addListener("dom-ready", () => {
		const url = browserView.webContents.getURL();
		const title = browserView.webContents.getTitle();
		const isErrorPage = url.endsWith(errorPage) && url.startsWith("file:///");
		const targetUrl = isErrorPage ? currentUrl : url;

		currentTab = new tab(targetUrl, url, title, null, isErrorPage, !currentPageIsFile);

		console.log(currentTab);

		store(currentTab.targetUrl);
		window.webContents.send("tab-update", currentTab);

		if (!initialized) {
			updateNavigation();
			initialized = true;
		}
	});

	browserView.webContents.addListener("page-title-updated", (event, title) => { window.webContents.send("page-title-update", title); });
	browserView.webContents.addListener("page-favicon-updated", (event, favicons) => { 
		currentTab.favicon = favicons[0];
		window.webContents.send("tab-favicon-update", currentTab.favicon); 
	});

	browserView.webContents.addListener("did-start-loading", () => { window.webContents.send("page-started-loading"); });
	browserView.webContents.addListener("did-stop-loading", () => { window.webContents.send("page-stopped-loading"); });

	browserView.webContents.addListener("did-fail-load", (event, errorCode, errorDescription, validatedUrl) => {
		currentUrl = validatedUrl;
		failedToLoad = true;
		loadPage(errorPage, true);
	});

	browserView.webContents.addListener("did-finish-load", () => {
		if (!currentPageIsFile)
			failedToLoad = false;
	});

	browserView.webContents.addListener("did-navigate", updateNavigation);
}

function updateNavigation() {
	const navigation = {
		canGoBack: browserView.webContents.canGoBack(),
		canGoForward: browserView.webContents.canGoForward()
	}
	
	window.webContents.send("update-arrow-navigation", navigation);
}

function loadPage(url, isFile) {
	if (!isFile) {
		browserView.webContents.loadURL(url);
		currentPageIsFile = false;
	} else {
		browserView.webContents.loadFile(url);
		currentPageIsFile = true;
	}
}

const loadHomePage = () => {
	loadPage(homePage, false);
}

ipcMain.on("resize-browserview", (event, bounds) => { browserView.setBounds(bounds); });
ipcMain.on("close-window", () => { app.quit(); });
ipcMain.on("minimize-window", () => { window.minimize(); });

ipcMain.on("maximize-window", () => {
	maximized = window.isMaximized();

	if (!maximized) {
		window.maximize();
	} else {
		window.unmaximize();
	}

	window.webContents.send("toggled-fullscreen", !maximized);
});

ipcMain.on("url-input", (event, url) => {
	if (url.match(/(^\S*$)?([a-zA-Z]*\.[a-zA-Z]{3}(?:\?|\#|$))/)) {
		url = "https://" + url;
	} else if (!url.startsWith("http://") && !url.startsWith("https://")) {
		// Search on google
		url = "https://google.com/search?q=" + url.replace(" ", "+");
	}

	loadPage(url, false);
});

ipcMain.on("go-back", () => { 
	if (browserView.webContents.canGoBack()) 
		browserView.webContents.goBack(); 
});

ipcMain.on("go-forward", () => { 
	if (browserView.webContents.canGoForward())
		browserView.webContents.goForward(); 
});

ipcMain.on("reload", () => { browserView.webContents.reload(); });
ipcMain.on("load-homepage", loadHomePage);
ipcMain.on("open-dev-tools", () => { browserView.webContents.openDevTools() });

app.whenReady().then(() => {
	createWindow()
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin")
		app.quit();
});