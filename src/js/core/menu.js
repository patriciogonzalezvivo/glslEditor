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
            main.open(event.target.files[0]);
        });
        this.menus.open = new MenuItem(this.menuDOM, "Open", (event) => {
            this.fileInput.click();
        });
        
        // SAVE
        this.menus.save = new MenuItem(this.menuDOM, "Save", (event) => {
            main.downloadContent();
        });

        // this.menus.save = new MenuItem(this.menuDOM, "Share link", (event) => {
        //     console.log("SHARE");
        //     main.saveOnServerAs((event) => {
        //         console.log(event);
        //     });
        // });
        
        container.appendChild(this.menuDOM);

        // Drag&drop
        // =========================

        // Set up drag/drop file listeners
        container.addEventListener('dragenter', (event) => {
            // Check to make sure that dropped items are files.
            // This prevents other drags (e.g. text in editor)
            // from turning on the file drop area.
            // See here: http://stackoverflow.com/questions/6848043/how-do-i-detect-a-file-is-being-dragged-rather-than-a-draggable-element-on-my-pa
            // Tested in Chrome, Firefox, Safari 8
            var types = event.dataTransfer.types;
            if (types !== null && ((types.indexOf) ? (types.indexOf('Files') !== -1) : types.contains('application/x-moz-file'))) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
            }
        }, true);

        container.addEventListener('dragover', (event) => {
            // Required to prevent browser from navigating to a file
            // instead of receiving a data transfer
            event.preventDefault();
        }, false);

        container.addEventListener('dragleave', (event) => {
            event.preventDefault();
        }, true);

        container.addEventListener('drop', (event) => {
            event.preventDefault();
            if (event.dataTransfer.files.length > 0) {
                const file = event.dataTransfer.files[0];
                main.open(file);
            }
        }, false);
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