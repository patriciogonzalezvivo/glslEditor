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
        this.menus.new = new MenuItem(this.el, 'ge_menu', '&#9737; New', (event) => {
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
        this.menus.open = new MenuItem(this.el, 'ge_menu', '&#8681; Open', (event) => {
            this.fileInput.click();
        });

        // SHARE
        this.menus.share = new MenuItem(this.el, 'ge_menu', '&#8682; Export', (event) => {
            if (main.change || !this.exportModal) {
                this.exportModal = new ExportModal('ge_export', { main: main, position: 'fixed' });
            }

            let bbox = this.menus.share.el.getBoundingClientRect();
            this.exportModal.presentModal(bbox.left - 5, bbox.top + bbox.height + 5);
        });

        // AUTOUPDATE
        var name = main.autoupdate ? 'Autoupdate: on' : 'Autoupdate: off';
        this.menus.autoupdate = new MenuItem(this.el, 'ge_menu', name, (event) => {
            if (main.autoupdate) {
                main.autoupdate = false;
                this.menus.autoupdate.name = 'Autoupdate: off';
                this.menus.update.show();
            } else {
                main.autoupdate = true;
                main.update();
                this.menus.autoupdate.name = 'Autoupdate: on';
                this.menus.update.hide();
            }
        });

        var name = main.pWindowOpen ? '&#9587 Finish presentation' : '&#x25A1; Presentation mode';
        this.menus.presentationWindow = new MenuItem(this.el, 'ge_menu', name, (event) => {
          if (main.pWindowOpen) {
            this.menus.presentationWindow.name = '&#128468; Open presentation window';
            main.togglePresentationWindow(false);
          } else {
            this.menus.presentationWindow.name = '&#9587 Close presentation window';
            main.togglePresentationWindow(true);
          }
        });


        this.menus.update = new MenuItem(this.el, 'ge_menu', '&#8635;', (event) => {
            main.update();
        });
        if (main.autoupdate) {
            this.menus.update.hide();
        }
        
        main.container.appendChild(this.el);
    }

    onClosePresentationWindow() {
      this.menus.presentationWindow.name = '&#x25A1; Presentation mode';
    }
}
