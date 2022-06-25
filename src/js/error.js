const { ipcRenderer } = require('electron');

document.querySelector("body > button").addEventListener("click", () => { ipcRenderer.send("reload"); });