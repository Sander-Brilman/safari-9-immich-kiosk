
class StorageRepository {

    /**
     * @param {string} localStorageKey 
     */
    constructor(localStorageKey) {
        this.localStorageKey = localStorageKey;

        /** @type {object | null} */
        this.instance = null;
    }

    get() {
        if (this.instance != null) {
            return this.instance;
        }

        try {
            this.instance = JSON.parse(localStorage.getItem(this.localStorageKey) || "null");
        } catch (error) {
            console.error(error);
            return null;
        }

        return this.instance;
    }

    /**
     * @param {Object} obj 
     */
    saveNew(obj) {
        this.instance = obj;
        localStorage.setItem(this.localStorageKey, JSON.stringify(obj))
    }

    save() {
        localStorage.setItem(this.localStorageKey, JSON.stringify(this.instance))
    }
}



class Settings {

    /**
     * @param {object} object 
     */
    static fromObject(object) {
        return new Settings(
            object.immichApiKey,
            object.immichServerUrl,
            object.animationSpeed,
            object.slideDuration
        );
    }

    /**
     * @param {string} jsonInputValue 
     */
    static fromJson(jsonInputValue) {
        try {
            var jsonParseResult = JSON.parse(jsonInputValue);
            return Settings.fromObject(jsonParseResult);
        } catch (error) {
            console.error(error);
            return this.default();
        }
    }

    static default() {
        return new Settings(
            "",
            "",
            1000,
            30000
        )
    }

    /**
     * @param {string} immichApiKey 
     * @param {string} immichServerUrl 
     * @param {number} animationSpeed 
     * @param {number} slideDuration 
     */
    constructor(immichApiKey, immichServerUrl, animationSpeed, slideDuration) {
        this.immichApiKey = immichApiKey;
        this.immichServerUrl = immichServerUrl;
        this.animationSpeed = animationSpeed;
        this.slideDuration = slideDuration;
    }

    /**
     * @param {() => void} onValid 
     * @param {() => void} onInvalid 
     */
    validate(onValid, onInvalid) {

        if (this.immichServerUrl == undefined || this.immichServerUrl.length == 0) {
            onInvalid();
            return;
        }

        if (this.immichApiKey == undefined || this.immichApiKey.length == 0) {
            onInvalid();
            return;
        }

        if (this.animationSpeed == undefined || isNaN(this.animationSpeed)) {
            onInvalid();
            return;
        }

        if (typeof this.animationSpeed == "string") {
            this.animationSpeed = parseInt(this.animationSpeed);
        }

        if (this.slideDuration == undefined || isNaN(this.slideDuration)) {
            onInvalid();
            return;
        }

        if (typeof this.slideDuration == "string") {
            this.slideDuration = parseInt(this.slideDuration);
        }

        // $.get(targetSettings.immichServerUrl, function(response) {
        //     onValid()
        // }).catch(function(e) {
        //     onInvalid()
        // })

        onValid()
    }
}

class SettingsRepository extends StorageRepository {
    constructor() {
        super("settings");

        /** @type {Settings} */
        this.instance = undefined
    }

    /**
     * 
     * @returns {Settings}
     */
    get() {
        if (this.instance != undefined) {
            return this.instance;
        }

        this.instance = super.get();
        if (this.instance != undefined) {
            this.instance = Settings.fromObject(this.instance);
        } else {
            this.instance = Settings.default();
        }

        return this.instance;
    }
}









class State {
    constructor() {
        this.mostRecentAlbumId = "";
        this.configFileUrl = "";
    }
}

class StateRepository extends StorageRepository {
    constructor() {
        super("state");

        /** @type {State} */
        this.instance
    }

    get() {
        this.instance = super.get() || new State();
        return this.instance;
    }
}
