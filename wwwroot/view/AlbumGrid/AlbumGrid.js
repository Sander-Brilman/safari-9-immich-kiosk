
class AlbumGridView extends ViewBase {

    /**
     * 
     * @param {StateRepository} stateRepo 
     * @param {ImmichClient} immichClient 
     */
    constructor(stateRepo, immichClient) {
        super("view/AlbumGrid/AlbumGrid.html");

        this.stateRepo = stateRepo;
        this.immichClient = immichClient;
    }

    /**
     * @abstract
     * 
     * @param {JQuery<HTMLElement>} view 
     * @param {() => void} onComplete 
     */
    onInit(view, onComplete) {

        var buttonGrid = view.filter(`.album-grid`);
        var thisRef = this;

        $.get(this.immichClient.url("/albums"), function (albums) {

            albums.forEach(function (album) {

                var button = $(`
                    <button class="glass-tile">
                        <i class="bi bi-images"></i> ${album.albumName}<br>
                        <small>${album.assetCount} assets</small>
                    </button>
                    `)
                    .click(function () {
                        
                        thisRef.stateRepo.getInstance().mostRecentAlbumId = album.id;
                        thisRef.stateRepo.save(thisRef.stateRepo.getInstance());


                        openView(new AlbumSlideShowView(album.id, thisRef.immichClient))
                    })

                buttonGrid.append(button)

            });

            view.append(buttonGrid);
            onComplete();
        });
    }
}
