

class AlertsView extends ViewBase {

    constructor() {
        super("view/Alerts/Alerts.html");
    }

    /**
     * @param {string} message 
     * @param {string} type 
     * @param {string} boostrapIconClass 
     */
    _constructNew(message, type, boostrapIconClass) {
        var alertInstance = $(`
        <div class="alert ${type}">
            <i class="bi bi-${boostrapIconClass}"></i>
            <p>${message}</p>
        </div>
        `);

        this.view.append(alertInstance);

        setTimeout(function () {
        }, 1000);
    }

    /**
     * @param {string} message 
     */
    showSuccess(message) {
        this._constructNew(message, "success", "check2-circle");
    }

    /**
     * @param {string} message 
     */
    showInfo(message) {
        this._constructNew(message, "info", "info-square");
    }

    /**
     * @param {string} message 
     */
    showDanger(message) {
        this._constructNew(message, "danger", "exclamation-triangle-fill");
    }

    /**
     * @param {string} message 
     */
    showWarning(message) {
        this._constructNew(message, "warning", "exclamation-triangle-fill");
    }
}