class HeaderView extends ViewBase {

    /**
     * @param {AlbumGridView} gridView 
     * @param {SettingsView} settingsView 
     */
    constructor(gridView, settingsView) {
        super("view/HeaderView/HeaderView.html");

        this.gridView = gridView;
        this.settingsView = settingsView;
    }

    /**
     * @param {JQuery<HTMLElement>} view 
     * @param {() => void} onComplete 
     */
    onInit(view, onComplete) {

        var thisRef = this;

        view.find("#show-albums").on("click", function () {
            openView(thisRef.gridView);
        });

        view.find("#show-settings").on("click", function () {
            openView(thisRef.settingsView);
        });

        onComplete();

    }

}