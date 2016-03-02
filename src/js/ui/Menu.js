import MenuItem from 'app/ui/MenuItem';
import ShareModal from 'app/ui/modals/ShareModal';

export default class Menu {
    constructor (main) {
        this.main = main;
        this.menus = {};

        // CREATE MENU Container
        this.menuDOM = document.createElement('ul');
        this.menuDOM.setAttribute('class', 'ge_menu_bar');

        // NEW
        this.menus.new = new MenuItem(this.menuDOM, 'ge_menu', 'New', (event) => {
            console.log('NEW');
            main.new();
        });

        // OPEN
        this.fileInput = document.createElement('input');
        this.fileInput.setAttribute('type', 'file');
        this.fileInput.setAttribute('accept', 'text/x-yaml');
        this.fileInput.style.display = 'none';
        this.fileInput.addEventListener('change', (event) => {
            main.open(event.target.files[0]);
        });
        this.menus.open = new MenuItem(this.menuDOM, 'ge_menu', 'Open', (event) => {
            this.fileInput.click();
        });

        // SAVE
        this.menus.save = new MenuItem(this.menuDOM, 'ge_menu', 'Save', (event) => {
            main.download();
        });

        this.menus.share = new MenuItem(this.menuDOM, 'ge_menu', 'Share', (event) => {
            if (main.change || !this.shareModal) {
                this.shareModal = new ShareModal('ge_share', { main: main });
            }

            let bbox = this.menus.share.el.getBoundingClientRect();
            this.shareModal.presentModal(bbox.left - 5, bbox.top + bbox.height + 5);
        });
        main.container.appendChild(this.menuDOM);
    }
}
