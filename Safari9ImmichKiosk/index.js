/**
 * @typedef {Object} AppSettings
 * @property {string} immichApiKey
 * @property {string} immichServerUrl
 * @property {string} mostRecentAlbumId
 * @property {number} animationSpeed
 * @property {number} slideDuration
 */

/** @type {AppSettings} */

var settings = JSON.parse(localStorage.getItem("settings") || "{}");
settings.animationSpeed = settings.animationSpeed || 1000;// fallback
settings.slideDuration = settings.slideDuration || 30000;// fallback


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

    onValid();
}

/**
 * @param {AppSettings} targetSettings 
 */
function saveSettings(targetSettings) {
    localStorage.setItem("settings", JSON.stringify(targetSettings))
}



var viewContainer = $("main");
var messageBox = $(".message");

function showMessage(errorText, styleClass) {
    messageBox
        .show()
        .attr("class", `message ${styleClass}`)
        .children("span")
        .text(errorText);
}



/**
 * @param {JQuery<HTMLElement>} elem 
 */
function loadView(elem) {

    elem.hide()
    viewContainer.prepend(elem);
    elem.fadeIn(settings.animationSpeed);

    if (viewContainer.children().length > 1) {
        viewContainer.children().last().fadeOut(settings.animationSpeed, function () { this.remove() })
    }

}

/**
 * @param {string} path 
 * @param {string} query 
 */
function url(path, query) {
    if (query == undefined) {
        query = "";
    }
    return `${settings.immichServerUrl}${path}?apiKey=${settings.immichApiKey}&${query}`;
}

/**
 * @param {(elem:JQuery<HTMLElement>) => void} onComplete 
 */
function createAlbumGrid(onComplete) {
    var container = $('<div>')
    var buttonGrid = $(`<div class="album-grid">`)

    $.get(url("/api/albums"), function (albums) {

        albums.forEach(function (album) {

            var button = $(`<button class="glass-tile"><i class="bi bi-images"></i> ${album.albumName}<br><small>${album.assetCount} assets</small></button>`)
                .click(function () {
                    loadAlbum(album.id)
                })

            buttonGrid.append(button)

        });

        container.append(buttonGrid);
        onComplete(container);
    });
}

function createSingleAssetView(asset) {
    if (asset == undefined || asset.type == "VIDEO") {
        return $("<div>");
    }

    var srcUrl = url(`/api/assets/${asset.id}/thumbnail`, "size=preview")
    var img = $("<div>")
        .addClass("img content-bottom")
        .css('background-image', 'url(' + srcUrl + ')');

    if (asset.exifInfo && asset.exifInfo.city && asset.exifInfo.country) {

        var year = new Date(asset.localDateTime).getFullYear()
        var locationInfo = $(`<h3 class="location glass-tile"><i class="bi bi-geo-fill"></i> ${asset.exifInfo.city}<br><small>${asset.exifInfo.country}, ${year}</small></h3>`)

        img.append(locationInfo);

    }

    // setTimeout(function() { img.css("background-size", "110%") }, 1000)

    return img;
}

var refreshAssetsIntervalId = 0;
var loadNextAssetIntervalId = 0;
function clearAlbumIntervals() {
    clearInterval(refreshAssetsIntervalId);
    clearInterval(loadNextAssetIntervalId);
}

/**
 * @param {string} albumId 
 */
function loadAlbum(albumId) {
    settings.mostRecentAlbumId = albumId;
    saveSettings(settings);

    var assets = [];
    var assetsPointer = 0;

    /**
     * @param {() => void} onComplete 
     */
    function fetchAlbumAssets(onComplete) {
        var albumUrl = url("/api/albums/" + albumId);
        $.get(albumUrl, function (album) {
            album.assets.sort(function () { return 0.5 - Math.random() });
            assets = album.assets;
            if (onComplete) {
                onComplete()
            }
        });
    }

    clearAlbumIntervals();

    refreshAssetsIntervalId = setInterval(function () { fetchAlbumAssets() }, 300000)// 5 minutes = 300_000
    loadNextAssetIntervalId = setInterval(function () {
        if (assets.length <= 0) {
            return;
        }

        assetsPointer = ++assetsPointer % assets.length
        loadView(createSingleAssetView(assets[assetsPointer]));
    }, settings.slideDuration);

    fetchAlbumAssets(function () { loadView(createSingleAssetView(assets[assetsPointer])); });
}

/**
 * @param {(elem:JQuery<HTMLElement>) => void} onComplete 
 */
function createSettingsView(onComplete) {

    var settingsForm = $(`
    <form class="settings-form">
        <label class="glass-tile field">
            <span>Immich server url:</span>
            <input type="text" id="immich-server-url">
        </label>

        <label class="glass-tile field">
            <span>Immich api key</span>
            <input type="text" id="immich-api-key">
        </label>

        <label class="glass-tile field">
            <span>Slide duration</span>
            <input type="number" id="slide-duration">
        </label>

        <label class="glass-tile field">
            <span>Animation Speed</span>
            <input type="number" id="animation-speed">
        </label>

        <button class="glass-tile" type="submit"><i class="bi bi-check-lg"></i> Save</button>
    <form>
    `);

    var serverUrlInput = settingsForm.find("#immich-server-url").val(settings.immichServerUrl);
    var apiKeyInput = settingsForm.find("#immich-api-key").val(settings.immichApiKey);
    var animationSpeedInput = settingsForm.find("#animation-speed").val(settings.animationSpeed);
    var slideDurationInput = settingsForm.find("#slide-duration").val(settings.slideDuration);

    settingsForm.submit(function (e) {
        e.preventDefault();
        console.log("form submit");


        /** @type {AppSettings} */
        var newSettings = {
            animationSpeed: animationSpeedInput.val().trim(),
            slideDuration: slideDurationInput.val().trim(),
            immichApiKey: apiKeyInput.val().trim(),
            immichServerUrl: serverUrlInput.val().trim(),
            mostRecentAlbumId: settings.mostRecentAlbumId,// just take the current
        }

        validateSettings(newSettings,
            function () {// valid
                console.log("settings are valid");

                settings = newSettings;
                saveSettings(settings);

                messageBox.fadeOut(settings.animationSpeed);
                albumsButton.fadeIn(settings.animationSpeed);
                showMessage("Settings saved!", "success");
            },
            function () {// invalid
                console.log("settings are not valid");
                showMessage("Settings are not valid", "error");
            }
        )
    })

    onComplete(settingsForm);
}


var albumsButton = $("#show-albums");
var settingsButton = $("#show-settings");

function initForcedFirstSetup() {
    console.log("forced first setup");

    albumsButton.fadeOut(settings.animationSpeed)
    createSettingsView(loadView);
}

function initNormalStartup() {
    console.log("settings valid, starting app");

    albumsButton
        .click(function () {
            clearAlbumIntervals();
            createAlbumGrid(loadView);
        })
        .fadeIn(settings.animationSpeed)

    settingsButton
        .click(function () {
            clearAlbumIntervals();
            createSettingsView(loadView);
        })
        .fadeIn(settings.animationSpeed)

    if (settings.mostRecentAlbumId && settings.mostRecentAlbumId.length > 0) {
        console.log("Recently opened album found, automatically opening");
        loadAlbum(settings.mostRecentAlbumId);
        return;
    }

    console.log("no Recently opened album found, opening album grid");
    createAlbumGrid(loadView);
}

validateSettings(
    settings,

    function () {// valid local settings, statup as normal
        initNormalStartup()

        // perform some extra checks to warn the user about potential settings file being left exposed
        $.get("/app-settings.json", function (fetchedSettings) {
            console.log("settings from server found while local settings already exist, this file should be remove to prevent leaking api keys", fetchedSettings);
            showMessage("Settings file is still present on the server (/app-settings.json). Remove this file ASAP to prevent leaking your api key", "error");
        });
    },

    function () {// invalid, try to fetch from server
        console.log("invalid local settings, trying to fetch from the server on /app-settings.json");

        $.get("/app-settings.json", function (fetchedSettings) {
            console.log("settings from server", fetchedSettings);
            settings = fetchedSettings;

            validateSettings(fetchedSettings,
                function () {// valid settings from server
                    console.log("valid settings");
                    showMessage("Settings file successfully imported from /app-settings.json. Dont forget to remove this file to prevent leaking the api key", "success");
                    saveSettings(settings);
                    initNormalStartup();
                },
                function() {// (partially) invalid settings from the server
                    showMessage("Settings file partially imported from /app-settings.json, please review the config and press save when everything is allright. Dont forget to remove this settings file afterwards", "success");
                    initForcedFirstSetup()
                }
            )
        })
    }
);
