
class SettingsView extends ViewBase {

    /**
     * @param {SettingsRepository} settingsRepo 
     * @param {StateRepository} stateRepo 
     * @param {() => void} onSettingsSaved 
     */
    constructor(settingsRepo, stateRepo, onSettingsSaved) {
        super("view/Settings/Settings.html");

        this.settingsRepo = settingsRepo;
        this.stateRepo = stateRepo;
        this.onSettingsSaved = onSettingsSaved;
    }

    /**
     * @param {JQuery<HTMLElement>} form 
     */
    _initSettingsForm(form) {
        var thisRef = this;
        var settings = this.settingsRepo.getInstance();


        var serverUrlInput = form.find("#immich-server-url").val(settings.immichServerUrl);
        var apiKeyInput = form.find("#immich-api-key").val(settings.immichApiKey);
        var animationSpeedInput = form.find("#animation-speed").val(settings.animationSpeed);
        var slideDurationInput = form.find("#slide-duration").val(settings.slideDuration);
        var zoomMultiplier = form.find("#zoom-multiplier").val(settings.zoomMultiplier);

        form.submit(function (e) {
            e.preventDefault();

            var serverUrl = serverUrlInput.val().toString().trim();

            if (serverUrl[serverUrl.length - 1] == "/") {
                serverUrl = serverUrl.substring(0, serverUrl.length - 1);
            }

            console.log(serverUrl);
            

            /** @type {Settings} */
            var newSettings = new Settings(
                apiKeyInput.val().toString().trim(),
                serverUrl,
                parseInt(animationSpeedInput.val().toString()),
                parseInt(slideDurationInput.val().toString()),
                parseFloat(zoomMultiplier.val().toString())
            );

            console.log("form submit, new settings:", newSettings);

            newSettings.validate(
                function () {// valid
                    console.log("new settings are valid and have been saved");
                    settingsRepo.save(newSettings);
                    thisRef.onSettingsSaved();
                },
                function () {// invalid
                    console.error("new settings are not valid");
                }
            )
        })
    }

    /**
     * @param {JQuery<HTMLElement>} form 
     */
    _initImportForm(form) {
        var thisRef = this;
        var state = this.stateRepo.getInstance();

        var importUrlInput = form.find("#import-url").val(state.configFileUrl);
        var jsonTextInput = form.find('#json-text');
        
        form.submit(function (e) {
            console.log("import form submit");
            e.preventDefault();

            var jsonInputValue = jsonTextInput.val();
            var jsonInputIsFilled = typeof jsonInputValue == "string" && jsonInputValue.length > 0; 

            if (jsonInputIsFilled) {
                try {
                    var newSettings = Settings.fromJson(jsonInputValue.toString());
                    newSettings.validate(
                        function () {
                            console.info("Settings imported successfully!");

                            settingsRepo.save(newSettings);
                            thisRef.onSettingsSaved();
                        },
                        function () {
                            console.error(`Failed to import settings from json input.`)
                        }
                    );
                } catch (error) {
                    console.error(error);

                    // messageBox.showError(`Failed to import settings from json input, reason: ${error.message}`)
                }

                
                return;
            }

            
            state.configFileUrl = importUrlInput.val().toString();

            console.log(`importing settings from remote ${state.configFileUrl}`);
            console.log(`saving application state`, state);
            
            thisRef.stateRepo.save(state);

            $.get(state.configFileUrl, function (fetchedSettings) {

                var newSettings = Settings.fromObject(fetchedSettings);

                newSettings.validate(
                    function () {// valid
                        console.info("Settings imported successfully!");

                        settingsRepo.save(newSettings);
                        thisRef.onSettingsSaved();
                    },
                    function () {// invalid
                        console.error("Imported settings are not valid, please edit the remote json file to contain correct data or enter it manually");
                    }
                );
            })
                .catch(function (e) {
                    console.error(`Failed to import settings file, reason: ${e.statusText} ${e.responseText}`)
                })
        })
    }

    /**
     * @param {JQuery<HTMLElement>} form 
     */
    _initAdvancedSettingForm(form) {

        var value = (localStorage.getItem("enableDevtools") || "false");
        var enableDevtoolsInput = form.find("#enable-devtools").attr("checked", value);

        enableDevtoolsInput.on("change", function (e) {
            if (enableDevtoolsInput.is(":checked")) {
                // localStorage.setItem("enableDevtools", "true")
            } else {
                localStorage.removeItem("enableDevtools");
            }
        })

    }

    /**
     * @param {JQuery<HTMLElement>} view 
     * @param {() => void} onComplete 
     */
    onInit(view, onComplete) {


        var settingsForm = view.filter("#settings");
        this._initSettingsForm(settingsForm);

        var importForm = view.filter("#import");
        this._initImportForm(importForm);

        var advancedSettingForm = view.filter("#advanced-settings")
        this._initAdvancedSettingForm(advancedSettingForm);

        onComplete();
    }
}