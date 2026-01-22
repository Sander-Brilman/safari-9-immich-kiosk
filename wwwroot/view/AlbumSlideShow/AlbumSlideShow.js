
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
    "December"
]

class AlbumSlideShowView extends ViewBase {

    /**
     * @param {string} albumId 
     * @param {ImmichClient} immichClient 
     */
    constructor(albumId, immichClient) {
        super("view/AlbumSlideShow/AlbumSlideShow.html");
        this.albumId = albumId;

        this.refreshAssetsIntervalId = 0;
        this.loadNextAssetIntervalId = 0;
        this.preFetchTimeoutId = 0;
        this.preFetchIntervalId = 0;


        this.assets = [];
        this.currentAssetIndex = 0;

        this.immichClient = immichClient;

        /** @type {JQuery<HTMLElement>} */
        this.slideShowContainer
    }



    /**
     * @param {() => void | undefined} [onComplete=undefined] 
     */
    refreshAssets_Then(onComplete) {
        var thisRef = this;
        var url = this.immichClient.apiUrl(`/albums/${this.albumId}`);

        $.get(url, function (album) {
            album.assets.sort(function () { return 0.5 - Math.random() });
            thisRef.assets = album.assets;

            if (onComplete) {
                onComplete()
            }
        })
            .catch(function (e) {
                console.error(e);

                // messageBox.showError("Failed to fetch album assets, please check your settings and network connection");
            });
    }





    /**
     * @param {number} assetIndex 
     */
    loopAssetIndex(assetIndex) {
        if (assetIndex < 0) {
            assetIndex = (Math.abs(assetIndex) % this.assets.length);
            assetIndex = (this.assets.length - 1) - assetIndex;
        }

        assetIndex = assetIndex % this.assets.length;
        return assetIndex;
    }




    /**
     * @param {number} assetIndex 
     */
    addAssetToViewStack(assetIndex) {
        if (this.assets.length <= 0) { return; }

        assetIndex = this.loopAssetIndex(assetIndex);

        var asset = this.assets[assetIndex];

        var slideContainer = $(`<div class="slide">`);
        var slide = new SingleAssetSlide(asset, this.immichClient, settingsRepo.getInstance());
        
        var thisRef = this;
        openViewIn(slideContainer, slide, function() {
            thisRef.slideShowContainer.prepend(slideContainer);
            slideContainer[0].scrollIntoView();
        });
    }

    removeTopAssetFromViewStack() {
        var settings = settingsRepo.getInstance();
        this.slideShowContainer.children().last().fadeOut(settings.animationSpeed, function () { this.remove() });

    }




    setIntervals() {
        var settings = settingsRepo.getInstance();
        var Interval2Minutes = 120000;
        var thisRef = this;

        this.onRemove(function () { });// remove all existing intervals

        this.refreshAssetsIntervalId = setInterval(function () { thisRef.refreshAssets_Then() }, Interval2Minutes)
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
     * 
     * @param {JQuery<HTMLElement>} view 
     * @param {() => void} onComplete 
     */
    onInit(view, onComplete) {

        var thisRef = this;
        this.slideShowContainer = view.filter("#slide-show-container")

        var previousButton = $(`<button class="glass-tile"><i class="bi bi-arrow-left"></i> Previous slide</button>`)
            .on("click", function () {
                thisRef.currentAssetIndex--;
                thisRef.setIntervals();
                thisRef.addAssetToViewStack(thisRef.currentAssetIndex);
                thisRef.removeTopAssetFromViewStack();
            });

        var nextButton = $(`<button class="glass-tile">Next slide <i class="bi bi-arrow-right"></i></button>`)
            .on("click", function () {
                thisRef.currentAssetIndex++;
                thisRef.setIntervals();
                thisRef.addAssetToViewStack(thisRef.currentAssetIndex);
                thisRef.removeTopAssetFromViewStack();
            })

        view.filter("#controls-container").append([previousButton, nextButton]);

        this.setIntervals();
        this.refreshAssets_Then(function () {
            thisRef.addAssetToViewStack(thisRef.currentAssetIndex);
            onComplete();
        });

    }


    /**
     * @override
     * 
     * @param {() => void} onComplete 
     */
    onRemove(onComplete) {
        clearInterval(this.refreshAssetsIntervalId);
        clearInterval(this.loadNextAssetIntervalId);
        clearInterval(this.preFetchIntervalId);

        clearTimeout(this.preFetchTimeoutId);

        if (onComplete) {
            onComplete();
        }
    }

}
