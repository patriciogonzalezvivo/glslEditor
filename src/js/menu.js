'use strict';

import GlslEditor from 'app/GlslEditor';

export default class Menu {
    constructor (container, main) {
    	this.menus = {};

    	// CREATE MENU Container
        this.menuDOM = document.createElement('ul');
        this.menuDOM.setAttribute('class', 'ge_menu');

        // Create Menu elements
        this.menus.new = new MenuItem(this.menuDOM, "New", (event) => {
            console.log("NEW");
            main.new();
        });
        this.menus.new = new MenuItem(this.menuDOM, "Open", (event) => {
            console.log("OPEN");
        });
        this.menus.new = new MenuItem(this.menuDOM, "Save", (event) => {
            console.log("SAVE");
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