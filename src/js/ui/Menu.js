'use strict';

import { saveOnServer } from 'app/io/serverLog';

export default class Menu {
    constructor (main) {
        this.main = main;
        this.menus = {};

        // CREATE MENU Container
        this.menuDOM = document.createElement('ul');
        this.menuDOM.setAttribute('class', 'ge_menu_bar');

        // NEW
        this.menus.new = new MenuItem(this.menuDOM, "New", (event) => {
            console.log("NEW");
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
        this.menus.open = new MenuItem(this.menuDOM, "Open", (event) => {
            this.fileInput.click();
        });
        
        // SAVE
        this.menus.save = new MenuItem(this.menuDOM, "Save", (event) => {
            main.download();
        });

        this.menus.save = new MenuItem(this.menuDOM, "Share", (event) => {
            console.log("SHARE");
            saveOnServer(this.main,(event) => {
                console.log(event);
                prompt('Use this url', 'http://editor.thebookofshaders.com/#'+event.url+event.path);
            })
        });
        
        main.container.appendChild(this.menuDOM);
    }
}

export class MenuItem {
    constructor (container, name, onClick = noop) {
        this.el = document.createElement('li');
        this.el.setAttribute('id', 'ge_menu_'+name);
        this.el.setAttribute('class', 'ge_menu');
        this.el.innerHTML = name;

        // Attach listeners, including those for tooltip behavior
        this.el.addEventListener('click', (event) => {
            // Execute onClick callback
            onClick(event);
        }, true);

        container.appendChild(this.el);
    }
}