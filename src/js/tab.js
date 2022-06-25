class tab {
	constructor(targetUrl, loadedUrl, title, favicon, isErrorPage, isWebPage) {
		this.targetUrl = targetUrl;
		this.loadedUrl = loadedUrl;
		this.title = title;
		this.favicon = favicon;
		this.isErrorPage = isErrorPage == null ? false : isErrorPage;
		this.isWebPage = isWebPage == null ? true : isWebPage;
	}

	get getUrl() {
		return this.targetUrl;
	}

	get getTitle() {
		return this.title;
	}
}

module.exports = {
	tab: tab,
}