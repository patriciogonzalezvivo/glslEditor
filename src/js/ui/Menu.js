'use strict';

import Modal from 'app/ui/modals/Modal';
import { saveOnServer, createOpenFrameArtwork } from 'app/io/share';

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
            console.log('SHARE',event);

            if (main.change || !this.shareModal) {
                let shareModal = new Modal('ge_share');
                let shareURL = new MenuItem(shareModal.el, 'ge_sub_menu', 'Copy URL...', (event) => {
                    saveOnServer(this.main, (event) => {
                        console.log("shareURL", event);
                        prompt('Use this url to share your code', 'http://editor.thebookofshaders.com/?log=' + event.name);
                        shareModal.removeModal();
                    });
                });

                let shareOF = this.menus.openframe = new MenuItem(shareModal.el, 'ge_sub_menu', '[o]', (event) => {
                    console.log('ADD TO OPENFRAME');
                    shareOF.el.innerHTML = '[o]... adding to collection';
                    saveOnServer(this.main, (event) => {
                        console.log("shareOF",event);
                        createOpenFrameArtwork(main, event.name, event.url, (success) => {
                            if (success) {
                                shareOF.el.innerHTML = '[o]... added!';
                            } else {
                                shareOF.el.innerHTML = '[o]... failed :(';
                            }
                            setTimeout(() => {
                                shareOF.el.innerHTML = '[o]';
                                shareModal.removeModal();
                            }, 4000);
                        });
                    });
                });
                this.shareModal = shareModal;
            }

            this.shareModal.presentModal(event.clientX-20,event.clientY+10);
        });
        main.container.appendChild(this.menuDOM);
    }
}

export class MenuItem {
    constructor (container, className, name, onClick) {
        this.el = document.createElement('li');
        this.el.setAttribute('id', className + '_' + name.replace(/\s+/g, '_'));
        this.el.setAttribute('class', className);
        this.el.innerHTML = name;

        // Attach listeners, including those for tooltip behavior
        this.el.addEventListener('click', (event) => {
            // Execute onClick callback
            onClick(event);
        }, true);

        if (container) {
            container.appendChild(this.el);
        }
    }
}
