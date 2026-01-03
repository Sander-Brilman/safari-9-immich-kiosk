
/**
 * @abstract
 */
class ViewBase {

    /**
     * @param {string} htmlFileUrl 
     */
    constructor(htmlFileUrl) {
        this.htmlFileUrl = htmlFileUrl;

        /** @type {JQuery<HTMLElement>} */
        this.view
    }

    /**
     * @param {(content: JQuery<HTMLElement>) => void} onComplete 
     */
    startViewInit(onComplete) {
        var thisRef = this;
        $.get(this.htmlFileUrl, function (rawViewHtml) {

            thisRef.view = $(rawViewHtml);

            thisRef.onInit(thisRef.view, function() {
                onComplete(thisRef.view);
            })
        })
    }

    /**
     * @param {() => void} onComplete 
     */
    startRemoval(onComplete) {
        this.onRemove(function() {
            onComplete();
        })
    }

    /**
     * @abstract
     * 
     * @param {JQuery<HTMLElement>} view 
     * @param {() => void} onComplete 
     */
    onInit(view, onComplete) {
        onComplete()
    }
    
    /**
     * @abstract
     * 
     * @param {() => void} onComplete 
     */
    onRemove(onComplete) {
        onComplete()
    }
}