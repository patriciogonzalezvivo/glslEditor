'use strict';

import Modal from 'app/ui/modals/Modal'

let domCache;

export default class TootTip extends Modal {
    constructor (string, url) {
        super('tooltip-');

        this.string = string;
        this.url = url;

        this.width = 0;
        this.height = 0;

        this.init();
    }

	init () {
        let modal = document.createElement('div');
        modal.className = this.CSS_PREFIX + 'modal';

        let link = document.createElement(this.url?'a':'p');
        link.id = this.CSS_PREFIX + 'link';
        if (this.url) {
            link.setAttribute('href', this.url);
            link.setAttribute('target','_blank');
        }
        link.innerHTML = this.string;
        modal.appendChild(link);
        domCache = modal;

        // Returns a clone of the cached document fragment
        this.el = domCache.cloneNode(true);

        this.dom = {};
        this.dom.modal = this.el;
        this.dom.link = this.el.children[1];
    }

    presentModal (x, y) {
        super.presentModal(x,y);

        this.el.style.left = x + 'px';
        this.el.style.top = y + 'px';
        document.body.appendChild(this.el);

        this.draw();
    }
}

