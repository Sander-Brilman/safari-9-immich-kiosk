
class SettingsView extends ViewBase {

    /**
     * @param {SettingsRepository} settingsRepo 
     * @param {StateRepository} stateRepo 
     * @param {() => void} onSettingsSaved 
     */
    constructor(settingsRepo, stateRepo, onSettingsSaved) {
        super("view/SettingsView/SettingsView.html");

        this.settingsRepo = settingsRepo;
        this.stateRepo = stateRepo;
        this.onSettingsSaved = onSettingsSaved;
    }

    /**
     * @param {JQuery<HTMLElement>} form 
     */
    _initSettingsForm(form) {
        var thisRef = this;
        var settings = this.settingsRepo.get();


        var serverUrlInput = form.find("#immich-server-url").val(settings.immichServerUrl);
        var apiKeyInput = form.find("#immich-api-key").val(settings.immichApiKey);
        var animationSpeedInput = form.find("#animation-speed").val(settings.animationSpeed);
        var slideDurationInput = form.find("#slide-duration").val(settings.slideDuration);

        form.submit(function (e) {
            console.log("settings form submit");
            e.preventDefault();

            /** @type {Settings} */
            var newSettings = new Settings(
                apiKeyInput.val().toString().trim(),
                serverUrlInput.val().toString().trim(),
                parseInt(animationSpeedInput.val().toString()),
                parseInt(slideDurationInput.val().toString())
            );

            console.log("new settings", newSettings);


            newSettings.validate(
                function () {// valid
                    console.log("new settings are valid and have been saved");
                    settingsRepo.saveNew(newSettings);
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
        var state = this.stateRepo.get();

        var importUrlInput = form.find("#import-url").val(state.configFileUrl);
        var jsonTextInput = form.find('#json-text');

        form.submit(function (e) {
            console.log("import form submit");
            e.preventDefault();

            var jsonInputValue = jsonTextInput.val();
            if (jsonInputValue instanceof String && jsonInputValue.length > 0) {
                try {
                    var newSettings = Settings.fromJson(jsonInputValue.toString());
                    newSettings.validate(
                        function () {
                            console.info("Settings imported successfully!");

                            settingsRepo.saveNew(newSettings);
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

            thisRef.stateRepo.get().configFileUrl = importUrlInput.val().toString();
            thisRef.stateRepo.save();

            $.get(state.configFileUrl, function (fetchedSettings) {

                var newSettings = Settings.fromObject(fetchedSettings);

                newSettings.validate(
                    function () {// valid
                        console.info("Settings imported successfully!");

                        settingsRepo.saveNew(newSettings);
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
                localStorage.setItem("enableDevtools", "true")
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


        var settingsForm = view.find("#settings");
        this._initSettingsForm(settingsForm);

        var importForm = view.find("#import");
        this._initImportForm(importForm);

        var advancedSettingForm = view.find("#advanced-settings")
        this._initAdvancedSettingForm(advancedSettingForm);

        onComplete();
    }
}