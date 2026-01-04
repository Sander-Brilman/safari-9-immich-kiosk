
var alertContainer = $("#alerts");
var mainViewContainer = $("main");
var headerContainer = $("header");


var settingsRepo = new SettingsRepository();
var stateRepo = new StateRepository();

var alertView = new AlertsView();





/**
 * @param {ViewBase} newViewObj 
 */
function openView(newViewObj) {
    openViewIn(mainViewContainer, newViewObj);
}


function initForcedSettingsView() {
    console.log("forced first setup");
    alertView.showInfo("Fill in the settings below to use the photo frame")


    openView(new SettingsView(settingsRepo, stateRepo, initNormalStartup));
}

function initNormalStartup() {

    var immichClient = ImmichClient.fromSettings(settingsRepo.getInstance());

    var state = stateRepo.getInstance();
    var gridView = new AlbumGridView(stateRepo, immichClient);
    var settingsView = new SettingsView(settingsRepo, stateRepo, function () {
        immichClient = ImmichClient.fromSettings(settingsRepo.getInstance());
        alertView.showSuccess("Settings saved!");
    })

    openViewIn(headerContainer, new HeaderView(gridView, settingsView))

    if (state.mostRecentAlbumId && state.mostRecentAlbumId.length > 0) {
        console.log("Recently opened album found, automatically opening");
        openView(new AlbumSlideShowView(state.mostRecentAlbumId, immichClient));
        return;
    }

    console.log("no Recently opened album found, opening album grid");

    openView(gridView);
}

function init() {
    settingsRepo.getInstance().validate(
        function () {// valid settings, statup as normal
            console.log(`local settings valid, normal startup`);
            initNormalStartup()
        },

        function (errors) {// invalid, try to fetch from server
            console.log(`invaild local settings, forcing settings view, errors: `, errors);
            initForcedSettingsView()
        }
    );
}

openViewIn(alertContainer, alertView, init);

