
class ImmichClient {

    /**
     * @param {Settings} settings 
     */
    static fromSettings(settings) {
        return new ImmichClient(settings.immichServerUrl, settings.immichApiKey);
    }

    /**
     * @param {string} serverUrl 
     * @param {string} apiKey 
     */
    constructor(serverUrl, apiKey) {
        this.serverUrl = serverUrl;
        this.apiKey = apiKey;
    }

    /**
     * @param {string} path 
     * @param {string|undefined} [query=undefined] 
     */
    apiUrl(path, query) {
        if (query == undefined) {
            query = "";
        }
        return `${this.serverUrl}/api${path}?apiKey=${this.apiKey}&${query}`;

    }

}
