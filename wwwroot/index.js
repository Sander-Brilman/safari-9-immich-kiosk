
var alertContainer = $("#alerts");
var mainViewContainer = $("main");
var headerContainer = $("header");


var settingsRepo = new SettingsRepository();
var stateRepo = new StateRepository();

var alertView = new AlertsView();




/**
 * @param {ViewBase} newViewObj 
 */
function openViewInContainer(container, newViewObj) {
    container.children().remove();

    newViewObj.startViewInit(function (newView) { 
        container.append(newView)
        newView.on("remove", function () { 
            newViewObj.onRemove(function() {}) 
        });
    });
}

/**
 * @param {ViewBase} newViewObj 
 */
function openView(newViewObj) {
    openViewInContainer(mainViewContainer, newViewObj);
}


function initForcedSettingsView() {
    console.log("forced first setup");
    alertView.showInfo("Fill in the settings below to use the photo frame")

    
    openView(new SettingsView(settingsRepo, stateRepo, initNormalStartup));
}

function initNormalStartup() {

    var immichClient = ImmichClient.fromSettings(settingsRepo.get());

    var state = stateRepo.get();
    var gridView = new AlbumGridView(stateRepo, immichClient);
    var settingsView = new SettingsView(settingsRepo, stateRepo, function() {
        immichClient = ImmichClient.fromSettings(settingsRepo.get());
        alertView.showSuccess("Settings saved!");
    })

    openViewInContainer(headerContainer, new HeaderView(gridView, settingsView))

    if (state.mostRecentAlbumId && state.mostRecentAlbumId.length > 0) {
        console.log("Recently opened album found, automatically opening");
        openView(new AlbumSlideShowView(state.mostRecentAlbumId, immichClient));
        return;
    }

    console.log("no Recently opened album found, opening album grid");

    openView(gridView);
}


console.log(settingsRepo.get());


settingsRepo.get().validate(
    function () {// valid settings, statup as normal
        console.log(`local settings valid, normal startup`);
        initNormalStartup()
    },

    function () {// invalid, try to fetch from server
        console.log(`invaild local settings, forcing settings view`);
        initForcedSettingsView()
    }
);
