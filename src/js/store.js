const { ipcMain } = require("electron");
const Store = require("electron-store");
const storage = new Store();

const store = (url) => {
	storage.set("url", url);
}

function load() {
	const url = storage.get("url");
	return url;
}

module.exports = {
	store: store,
	load: load,
}