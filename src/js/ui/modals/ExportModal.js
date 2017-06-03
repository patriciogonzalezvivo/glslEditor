import MenuItem from '../MenuItem';
import Modal from './Modal';
import { saveOnServer, createOpenFrameArtwork } from '../../io/share';

export default class ExportModal extends Modal {
    constructor (CSS_PREFIX, properties) {
        super(CSS_PREFIX, properties);
        this.main = properties.main;

        this.save = new MenuItem(this.el, 'ge_sub_menu', 'Download file', (event) => {
            properties.main.download();
        });

        this.codeURL = new MenuItem(this.el, 'ge_sub_menu', 'Code URL...', (event) => {
            saveOnServer(this.main, (event) => {
                prompt('Use this url to share your code', 'http://thebookofshaders.com/edit.php?log=' + event.name);
                this.removeModal();
            });
        });

        this.shaderURL = new MenuItem(this.el, 'ge_sub_menu', 'Artwork URL...', (event) => {
            saveOnServer(this.main, (event) => {
                prompt('Use this url to share your artwork', 'http://player.thebookofshaders.com/?log=' + event.name);
                this.removeModal();
            });
        });

        let shareOF = new MenuItem(this.el, 'ge_sub_menu', 'Artwork to [o]', (event) => {
            shareOF.el.innerHTML = 'Artwork to [o]: adding to collection';
            saveOnServer(this.main, (event) => {
                createOpenFrameArtwork(this.main, event.name, event.url, (success) => {
                    if (success) {
                        shareOF.el.innerHTML = 'Artwork to [o]: added!';
                    }
                    else {
                        shareOF.el.innerHTML = 'Artwork to [o]: failed :(';
                    }
                    setTimeout(() => {
                        shareOF.el.innerHTML = '[o]';
                        this.removeModal();
                    }, 4000);
                });
            });
        });
    }
}
