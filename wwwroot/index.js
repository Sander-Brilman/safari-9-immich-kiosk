class AppSettings {
    constructor() {
        this.immichApiKey = "";
        this.immichServerUrl = "";
        this.animationSpeed = 1000;
        this.slideDuration = 30000;
    }
}

class AppState {
    constructor() {
        this.mostRecentAlbumId = "";
        this.configFileUrl = "";
    }
}

/**
 * @abstract
 */
class ViewBase {

    /**
     * @virtual
     * @param {(content:JQuery<HTMLElement>) => void} onComplete 
     */
    getHeaderContent(onComplete) {
        if (onComplete == undefined) {
            return;
        }

        var defaultHeader = $(`
        <div>
            <button class="glass-tile" id="show-albums"><i class="bi bi-images"></i> Albums</button>
            <button class="glass-tile" id="show-settings"><i class="bi bi-gear-wide-connected"></i> Settings</button>

            <h3>Scroll to the bottom for "full screen mode"</h3>
        </div>
        `);

        defaultHeader.find("#show-albums").on("click", function () {
            showView(new AlbumGridView());
        });

        defaultHeader.find("#show-settings").on("click", function () {
            showView(new SettingsView(true));
        });

        onComplete(defaultHeader)
    }

    /**
     * @abstract
     * @param {(content:JQuery<HTMLElement>) => void} onComplete 
     */
    getViewContent(onComplete) {
        console.error("getViewContent not implemented")
        if (onComplete) {
            onComplete();
        }
    }

    /**
     * @virtual
     * @param {() => void} onComplete 
     */
    remove(onComplete) {
        if (onComplete) {
            onComplete();
        }
    }
}


function localStorageTryLoad(key, fallback) {
    var result;
    try {
        result = JSON.parse(localStorage.getItem(key) || "null") || fallback;
    } catch (error) {
        console.error(error);
        result = fallback;
    }
    return result;
}


/** @type {AppSettings} */
var settings = localStorageTryLoad("settings", new AppSettings());

/** @type {AppState} */
var state = localStorageTryLoad("state", new AppState());

console.log(settings);
console.log(state);



function saveSettings() {
    localStorage.setItem("settings", JSON.stringify(settings))
}

function saveState() {
    localStorage.setItem("state", JSON.stringify(state))
}

/**
 * @param {AppSettings} targetSettings 
 * @param {() => void} onValid 
 * @param {() => void} onInvalid 
 */
function validateSettings(targetSettings, onValid, onInvalid) {

    if (targetSettings.immichServerUrl == undefined || targetSettings.immichServerUrl.length == 0) {
        onInvalid();
        return;
    }

    if (targetSettings.immichApiKey == undefined || targetSettings.immichApiKey.length == 0) {
        onInvalid();
        return;
    }

    if (targetSettings.animationSpeed == undefined || parseInt(targetSettings.animationSpeed) == NaN) {
        onInvalid();
        return;
    }

    if (typeof targetSettings.animationSpeed == "string") {
        targetSettings.animationSpeed = parseInt(targetSettings.animationSpeed);
    }

    if (targetSettings.slideDuration == undefined || parseInt(targetSettings.slideDuration) == NaN) {
        onInvalid();
        return;
    }

    if (typeof targetSettings.slideDuration == "string") {
        targetSettings.slideDuration = parseInt(targetSettings.slideDuration);
    }

    $.get(targetSettings.immichServerUrl, function(response) {
        onValid()
    }).catch(function(e) {
        onInvalid()
    })
}


class MessageBox {
    /**
     * @param {JQuery<HTMLElement>} target 
     */
    constructor(target) {
        this.target = target;
    }

    hide() {
        this.target.fadeOut(200);
    }

    _show(text, typeClass) {
        this.target.attr("class", `message ${typeClass}`).fadeIn(200);
        this.target.text(text);
    }

    showSuccess(message) {
        this._show(message, "success")
    }

    showError(message) {
        this._show(message, "error")
    }

    showInfo(message) {
        this._show(message, "info")
    }
}

var messageBox = new MessageBox($(".message"));


var main = $("main");
var header = $("header");

/** @type {ViewBase} */
var currentViewObj = null;

/**
 * @param {ViewBase} newViewObj 
 */
function showView(newViewObj) {

    function loadNewView() {
        main.children().remove();
        header.children().remove();

        newViewObj.getViewContent(function (e) { main.append(e) });
        newViewObj.getHeaderContent(function (e) { header.append(e) });
    }

    if (currentViewObj == null) {
        loadNewView();
        currentViewObj = newViewObj;
        return;
    }

    currentViewObj.remove(function () {
        loadNewView();
        currentViewObj = newViewObj;
    })
}

/**
 * @param {string} path 
 * @param {string} query 
 */
function apiUrl(path, query) {
    if (query == undefined) {
        query = "";
    }
    return `${settings.immichServerUrl}/api${path}?apiKey=${settings.immichApiKey}&${query}`;
}

class AlbumGridView extends ViewBase {

    getViewContent(onComplete) {
        var container = $('<div><div class="album-grid"></div></div>');
        var buttonGrid = container.find(`.album-grid`);

        $.get(apiUrl("/albums"), function (albums) {

            albums.forEach(function (album) {

                var button = $(`
                    <button class="glass-tile">
                        <i class="bi bi-images"></i> ${album.albumName}<br>
                        <small>${album.assetCount} assets</small>
                    </button>
                    `)
                    .click(function () {
                        state.mostRecentAlbumId = album.id;
                        saveState();
                        showView(new AlbumSlideShowView(album.id))
                    })

                buttonGrid.append(button)

            });

            container.append(buttonGrid);
            onComplete(container);
        });
    }
}

class AlbumSlideShowView extends ViewBase {

    /**
     * @param {string} albumId 
     */
    constructor(albumId) {
        super();
        this.albumId = albumId;

        this.refreshAssetsIntervalId = 0;
        this.loadNextAssetIntervalId = 0;
        this.preFetchTimeoutId = 0;
        this.preFetchIntervalId = 0;


        this.assets = [];
        this.currentAssetIndex = 0;

        /** @type {JQuery<HTMLElement>} */
        this.container;
    }

    fetchAssetForCache(assetIndex) {
        assetIndex = this.loopAssetIndex(assetIndex);
        var assetId = this.assets[assetIndex].id;
        $.get(apiUrl(`/assets/${assetId}/thumbnail`, "size=preview"), function () { });
    }

    createSingleAssetView(asset) {
        if (asset == undefined) {
            return;
        }

        var srcUrl = apiUrl(`/assets/${asset.id}/thumbnail`, "size=preview");
        var img = $(`<div class="img content-bottom">`).css('background-image', 'url(' + srcUrl + ')');

        var months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ]

        var year = new Date(asset.localDateTime).getFullYear();
        var month = months[new Date(asset.localDateTime).getMonth()];

        var hasLocationInfo = asset.exifInfo == undefined || asset.exifInfo.city == undefined || asset.exifInfo.country == undefined;
        if (hasLocationInfo) {
            var infoCard = $(`
                <h3 class="glass-tile info-card">
                    <small class="time">${month} ${year}</small>
                </h3>
            `);

            return img.append(infoCard);
        }

        var infoCard = $(`
            <h3 class="glass-tile info-card location">
                <i class="bi bi-geo-fill"></i> 
                <span>
                    ${asset.exifInfo.city}<br>
                    <small>${asset.exifInfo.country},</small> <small>${month} ${year}</small>
                </span>
            </h3>
        `);

        return img.append(infoCard);
    }


    getHeaderContent(onComplete) {
        var thisRef = this;
        var previousButton = $(`<button class="glass-tile"><i class="bi bi-arrow-left"></i> Previous slide</button>`)
            .on("click", function () {
                thisRef.currentAssetIndex--;
                thisRef.resetIntervals();
                thisRef.addAssetToViewStack(thisRef.currentAssetIndex);
            });

        var nextButton = $(`<button class="glass-tile">Next slide <i class="bi bi-arrow-right"></i></button>`)
            .on("click", function () {
                thisRef.currentAssetIndex++;
                thisRef.resetIntervals();
                thisRef.addAssetToViewStack(thisRef.currentAssetIndex);
            })

        super.getHeaderContent(function (defaultHeader) {
            defaultHeader.append(previousButton);
            defaultHeader.append(nextButton);
            onComplete(defaultHeader);
        });
    }


    /**
     * @param {() => void} onComplete 
     */
    refreshAssets_Then(onComplete) {
        var thisRef = this;
        $.get(apiUrl(`/albums/${this.albumId}`), function (album) {
            album.assets.sort(function () { return 0.5 - Math.random() });
            thisRef.assets = album.assets;

            if (onComplete) {
                onComplete()
            }
        })
            .catch(function () {
                messageBox.showError("Failed to fetch album assets, please check your settings and network connection");
            });
    }

    loopAssetIndex(assetIndex) {
        if (assetIndex < 0) {
            assetIndex = (Math.abs(assetIndex) % this.assets.length);
            assetIndex = (this.assets.length - 1) - assetIndex;
        }

        assetIndex = assetIndex % this.assets.length;
        return assetIndex;
    }

    addAssetToViewStack(assetIndex) {
        if (this.assets.length <= 0) { return; }

        assetIndex = this.loopAssetIndex(assetIndex);

        var asset = this.assets[assetIndex];
        var view = this.createSingleAssetView(asset);

        this.container.prepend(view);
    }

    removeTopAssetFromViewStack() {
        this.container.children().last().fadeOut(settings.animationSpeed, function () { this.remove() });
    }

    resetIntervals() {
        var thisRef = this;
        this.remove();

        this.refreshAssetsIntervalId = setInterval(this.refreshAssets_Then, 300000)// 5 minutes = 300_000
        this.loadNextAssetIntervalId = setInterval(function () {

            thisRef.preFetchTimeoutId = setTimeout(function () {
                thisRef.removeTopAssetFromViewStack();
            }, settings.slideDuration / 3);

            thisRef.currentAssetIndex++;
            thisRef.addAssetToViewStack(thisRef.currentAssetIndex);

        }, settings.slideDuration);


    }

    /** 
     * @override 
     */
    getViewContent(onComplete) {
        var thisRef = this;
        this.container = $(`<div class="slide-show-container">`)

        this.refreshAssets_Then(function () {
            thisRef.addAssetToViewStack(thisRef.currentAssetIndex);
        });
        this.resetIntervals();

        onComplete(this.container);
    }

    remove(onComplete) {
        clearInterval(this.refreshAssetsIntervalId);
        clearInterval(this.loadNextAssetIntervalId);
        clearInterval(this.preFetchIntervalId);

        clearTimeout(this.preFetchTimeoutId);

        if (onComplete) {
            onComplete();
        }
    }

}

class SettingsView extends ViewBase {

    /**
     * @param {boolean} showHeader 
     */
    constructor(showHeader) {
        super();
        this.showHeader = showHeader;
    }

    getHeaderContent(onComplete) {
        if (this.showHeader) {
            super.getHeaderContent(onComplete)
        }
        onComplete(null)
    }

    getViewContent(onComplete) {
        $.get('view/settings.html', function (viewRaw) {

            /** @type {JQuery<HTMLElement>} */
            var view = $(viewRaw);

            var serverUrlInput = view.find("#immich-server-url").val(settings.immichServerUrl);
            var apiKeyInput = view.find("#immich-api-key").val(settings.immichApiKey);
            var animationSpeedInput = view.find("#animation-speed").val(settings.animationSpeed);
            var slideDurationInput = view.find("#slide-duration").val(settings.slideDuration);

            view.find("form#settings-form").submit(function (e) {
                console.log("settings form submit");
                e.preventDefault();

                /** @type {AppSettings} */
                var newSettings = {
                    animationSpeed: animationSpeedInput.val().trim(),
                    slideDuration: slideDurationInput.val().trim(),
                    immichApiKey: apiKeyInput.val().trim(),
                    immichServerUrl: serverUrlInput.val().trim(),
                }

                console.log("new settings", newSettings);


                validateSettings(newSettings,
                    function () {// valid
                        console.log("new settings are valid");

                        settings = newSettings;
                        saveSettings();
                        messageBox.showSuccess("Settings saved!");

                        initNormalStartup();
                    },
                    function () {// invalid
                        console.error("new settings are not valid");
                        messageBox.showError("Settings are not valid");
                    }
                )
            })


            var importUrlInput = view.find("#import-url").val(state.configFileUrl);
            var jsonTextInput = view.find('#json-text');
            view.find("form#import-form").submit(function (e) {
                console.log("import form submit");
                e.preventDefault();

                if (jsonTextInput.val().length > 0) {
                    try {
                        var newSettings = JSON.parse(jsonTextInput.val());
                        validateSettings(newSettings,
                            function() {
                                settings = newSettings;
    
                                saveSettings();
                                showView(new SettingsView(true));
    
                                messageBox.showSuccess("Settings imported successfully!");
                            },
                            function() {
                                messageBox.showError(`Failed to import settings from json input.`)
                            }
                        );
                    } catch (error) {
                        console.error(error);
                        
                        messageBox.showError(`Failed to import settings from json input, reason: ${error.message}`)
                    }    
                    return;
                }

                state.configFileUrl = importUrlInput.val();
                saveState();

                $.get(state.configFileUrl, function (fetchedSettings) {
                    validateSettings(fetchedSettings,
                        function () {// valid
                            settings = fetchedSettings;

                            saveSettings();
                            showView(new SettingsView(true));

                            messageBox.showSuccess("Settings imported successfully!");
                        },
                        function () {// invalid
                            messageBox.showError("Imported settings are not valid, please edit the remote json file to contain correct data or enter it manually");
                        }
                    );
                })
                    .catch(function (e) {
                        messageBox.showError(`Failed to import settings file, reason: ${e.statusText} ${e.responseText}`)
                    })
            })


            var enableDevtoolsInput = view.find("#enable-devtools").attr("checked", localStorage.getItem("enableDevtools") == "true");

            enableDevtoolsInput.on("change", function (e) {
                if (enableDevtoolsInput.is(":checked")) {
                    localStorage.setItem("enableDevtools", "true")
                } else {
                    localStorage.removeItem("enableDevtools");
                }
            })

            onComplete(view)
        })
    }
}



function initForcedSettingsView() {
    console.log("forced first setup");
    messageBox.showInfo("Fill in the settings below to use the photo frame")
    showView(new SettingsView(false));
}

function initNormalStartup() {
    console.log("settings valid, starting app");

    if (state.mostRecentAlbumId && state.mostRecentAlbumId.length > 0) {
        console.log("Recently opened album found, automatically opening");
        showView(new AlbumSlideShowView(state.mostRecentAlbumId));
        return;
    }

    console.log("no Recently opened album found, opening album grid");
    showView(new AlbumGridView())
}

validateSettings(
    settings,

    function () {// valid local settings, statup as normal
        console.log(`local settings, forcing settings view`);
        initNormalStartup()
    },

    function () {// invalid, try to fetch from server
        console.log(`invaild local settings, forcing settings view`);
        initForcedSettingsView()
    }
);
