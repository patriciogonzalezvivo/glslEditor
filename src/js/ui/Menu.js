import MenuItem from './MenuItem';
import ExportModal from './modals/ExportModal';

export default class Menu {
    constructor (main) {
        this.main = main;
        this.menus = {};

        // CREATE MENU Container
        this.el = document.createElement('ul');
        this.el.setAttribute('class', 'ge_menu_bar');

        // NEW
        this.menus.new = new MenuItem(this.el, 'ge_menu', '<i class="material-icons">add</i> New', (event) => {
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
        this.menus.open = new MenuItem(this.el, 'ge_menu', '<i class="material-icons">folder_open</i>  Open', (event) => {
            this.fileInput.click();
        });

        // AUTOUPDATE
        this.menus.autoupdate = new MenuItem(this.el, 'ge_menu', ' <span class="ge_menu_highlight"><i class="material-icons">autorenew</i></span> Auto Update', (event) => {
            if (main.autoupdate) {
                main.autoupdate = false;
                this.menus.autoupdate.name = '<span class="ge_menu_disabled">&#x25CF;</span> Auto Update';
                // this.menus.autoupdate.button.style.color = 'gray';
            } else {
                main.autoupdate = true;
                main.update();
                this.menus.autoupdate.name = ' <span class="ge_menu_highlight"><i class="material-icons">autorenew</i></span> Auto Update';
                // this.menus.autoupdate.button.style.color = 'white';
            }
        });
        // this.menus.autoupdate.button.style.color = main.autoupdate ? 'white' : 'gray';

        // TEST
        // this.menus.test = new MenuItem(this.el, 'ge_menu', '⟐ Test', (event) => {
        //     main.visualDebugger.check();
        // });

        // SHARE
        this.menus.share = new MenuItem(this.el, 'ge_menu', '<i class="material-icons">arrow_upward</i> Export', (event) => {
            if (main.change || !this.exportModal) {
                this.exportModal = new ExportModal('ge_export', { main: main, position: 'fixed' });
            }

            let bbox = this.menus.share.el.getBoundingClientRect();
            this.exportModal.presentModal(bbox.left - 5, bbox.top + bbox.height + 5);
        });

        main.container.appendChild(this.el);
    }
}
