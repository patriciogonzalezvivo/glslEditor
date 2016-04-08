import MenuItem from './MenuItem';
import ExportModal from './modals/ExportModal';

export default class Menu {
    constructor (main) {
        this.main = main;
        this.menus = {};

        // CREATE MENU Container
        this.menuDOM = document.createElement('ul');
        this.menuDOM.setAttribute('class', 'ge_menu_bar');

        // NEW
        this.menus.new = new MenuItem(this.menuDOM, 'ge_menu', '&#9737; New', (event) => {
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
        this.menus.open = new MenuItem(this.menuDOM, 'ge_menu', '&#8681; Open', (event) => {
            this.fileInput.click();
        });

        this.menus.share = new MenuItem(this.menuDOM, 'ge_menu', '&#8682; Export', (event) => {
            if (main.change || !this.exportModal) {
                this.exportModal = new ExportModal('ge_export', { main: main });
            }

            let bbox = this.menus.share.el.getBoundingClientRect();
            this.exportModal.presentModal(bbox.left - 5, bbox.top + bbox.height + 5);
        });
        main.container.appendChild(this.menuDOM);
    }
}
