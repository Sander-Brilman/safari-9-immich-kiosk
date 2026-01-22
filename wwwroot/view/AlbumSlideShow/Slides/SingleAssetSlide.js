

class SingleAssetSlide extends ViewBase {

    /**
     * @param {object} asset 
     * @param {ImmichClient} immichClient 
     * @param {Settings} settings 
     */
    constructor(asset, immichClient, settings) {
        super("view/AlbumSlideShow/Slides/SingleAssetSlide.html");

        this.asset = asset;
        this.immichClient = immichClient;
        this.settings = settings;
    }
    

    /**
     * @param {JQuery<HTMLElement>} view 
     * @param {() => void} onComplete 
     */
    onInit(view, onComplete) {
        
        var thisRef = this;
        var srcUrl = this.immichClient.apiUrl(`/assets/${this.asset.id}/thumbnail`, "size=preview");
        var img = view.filter('.img')
            .css('background-image', 'url(' + srcUrl + ')')
            .css('transition-duration', `${this.settings.slideDuration * 2}ms`);

        setTimeout(function () { thisRef.startZoomAnimation(img) }, 100);

        var simpleInfoCard = view.filter('.simple');
        var detailedInfoCard = view.filter('.detailed');

        var time = this.view.find(".time");
        this.templateTime(time);
        
        var hasLocationInfo = this.asset.exifInfo.city != undefined && this.asset.exifInfo.country != undefined;
        if (hasLocationInfo == false) {
            detailedInfoCard.hide();
            onComplete();
            return;
        }

        simpleInfoCard.hide();
        this.templateDetailedInfoCard(detailedInfoCard);

        onComplete();
    }

    /**
     * @param {JQuery<HTMLElement>} img 
     */
    startZoomAnimation(img) {
        img.css('transform', `scale(${this.settings.zoomMultiplier})`);// activate zoom animation 
    }

    /**
     * @param {JQuery<HTMLElement>} detailedInfoCard 
     */
    templateDetailedInfoCard(detailedInfoCard) {
        detailedInfoCard.find(".city").text(`${this.asset.exifInfo.city}`);
        detailedInfoCard.find(".country").text(`${this.asset.exifInfo.country},`);
    }

    /**
     * @param {JQuery<HTMLElement>} timeElement 
     */
    templateTime(timeElement) {
        var year = new Date(this.asset.localDateTime).getFullYear();
        var month = months[new Date(this.asset.localDateTime).getMonth()];
        timeElement.text(`${month} ${year}`);
    }



}