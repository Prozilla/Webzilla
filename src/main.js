const { app, BrowserWindow, ipcMain, BrowserView, webContents } = require("electron");
const path = require("path");

const homePage = "https://eosingieouiuz.com"; // https://google.com

let window;
let browserView

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
	window.webContents.openDevTools();

	window.on("maximize", () => {
		window.webContents.send("toggled-fullscreen", true);
	});
	
	window.on("unmaximize", () => {
		window.webContents.send("toggled-fullscreen", false);
	});

	browserView = new BrowserView({
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
			webSecurity: false,
		}
	});

	window.addBrowserView(browserView);
	browserView.setBounds({ x: 0, y: 0, width: 300, height: 300 });
	browserView.webContents.loadURL(homePage);

	browserView.webContents.addListener("dom-ready", () => {
		const page = {
			title: browserView.webContents.getTitle(),
			url: browserView.webContents.getURL()
		}
		
		window.webContents.send("page-update", page);
	});

	browserView.webContents.addListener("page-title-updated", (event, title) => { window.webContents.send("page-title-update", title); });
	browserView.webContents.addListener("page-favicon-updated", (event, favicons) => { window.webContents.send("page-favicon-update", favicons); });

	browserView.webContents.addListener("did-start-loading", () => { window.webContents.send("page-started-loading"); });
	browserView.webContents.addListener("did-stop-loading", () => { window.webContents.send("page-stopped-loading"); });

	browserView.webContents.addListener("did-fail-load", (event, errorCode, errorDescription, validatedUrl) => { 
		console.log(errorCode);
		console.log(errorDescription);
		console.log(validatedUrl);
	})
}

ipcMain.on("resize-browserview", (event, bounds) => {
	browserView.setBounds(bounds);
})

ipcMain.on("close-window", () => {
  	app.quit();
});

ipcMain.on("minimize-window", () => {
	window.minimize();
});

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
	if (url.startsWith("http://") || url.startsWith("https://")) {
		browserView.webContents.loadURL(url);
	} else {
		browserView.webContents.loadURL("https://www.google.com/search?q=" + url.replace(" ", "+"));
	}
});

ipcMain.on("load-homepage", () => {
	browserView.webContents.loadURL(homePage);
});

ipcMain.on("reload", () => {
	browserView.webContents.reload();
});

app.whenReady().then(() => {
	createWindow()
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin")
		app.quit();
});