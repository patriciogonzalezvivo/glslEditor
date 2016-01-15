'use strict';

import GlslEditor from 'app/GlslEditor';

export default class Menu {
    constructor (container, main) {
        this.menus = {};

        // CREATE MENU Container
        this.menuDOM = document.createElement('ul');
        this.menuDOM.setAttribute('class', 'ge_menu');

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
            const reader = new FileReader();
            reader.onload = (e) => {
                main.load({ contents: e.target.result });
            };
            reader.readAsText(event.target.files[0]);
        });
        this.menus.open = new MenuItem(this.menuDOM, "Open", (event) => {
            console.log("OPEN");
            this.fileInput.click();
        });
        
        // SAVE
        this.menus.exp = new MenuItem(this.menuDOM, "Export", (event) => {
            console.log("EXPORT");
            main.downloadContent();
        });

        this.menus.save = new MenuItem(this.menuDOM, "Share", (event) => {
            console.log("SHARE");
            main.saveOnServerAs((event) => {
                console.log(event);
            });
        });
        
        container.appendChild(this.menuDOM);
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