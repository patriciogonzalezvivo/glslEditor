'use strict';

import {addEvent, removeEvent} from 'app/tools/common'

const MODAL_VIEWPORT_EDGE_BUFFER = 20; // buffer zone at the viewport edge where a modal should not be presented

export default class Modal {
    constructor (CSS_PREFIX) {
        this.CSS_PREFIX = CSS_PREFIX;

        this.listeners = {};

        /**
         *  This initializes the renderer. It uses requestAnimationFrame() to
         *  smoothly render changes in the color picker as user interacts with it.
         */
        this.renderer = {
            // Stores a reference to the animation rendering loop.
            frame: null,

            drawFrame: () => {
                this.draw();
            },

            // Starts animation rendering loop
            start: () => {
                this.renderer.drawFrame();
                this.renderer.frame = window.requestAnimationFrame(this.renderer.start);
            },

            // Stops animation rendering loop
            stop: () => {
                window.cancelAnimationFrame(this.renderer.frame);
            }
        };
        this.isVisible = false;
    }

    draw () {
        // render rutine
    }

    close () {
        // Close rutine
    }

    showAt (cm) {
        let cursor = cm.cursorCoords(true, "page");
        let x = cursor.left - this.width*.5;
        let y = cursor.bottom + 20;

        // // Check if desired x, y will be outside the viewport.
        // // Do not allow the modal to disappear off the edge of the window.
        // let modalXPos = (x + this.width < window.innerWidth) ? x : (window.innerWidth - 20 - this.width);
        // let modalYPos = (y + this.height < window.innerHeight) ? y : (window.innerHeight - 20 - this.height);

        this.presentModal(x, y);
    }

    presentModal (x, y) {
        // Listen for interaction outside of the modal
        window.setTimeout(() => {
            this.onClickOutsideHandler = addEvent(document.body, 'click', this.onClickOutside, this);
        }, 0);
        this.isVisible = true;
    }

     /**
     *  Removes modal from DOM and destroys related event listeners
     */
    removeModal () {
        if (this.el && this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
        removeEvent(document.body, 'click', this.onClickOutsideHandler);
        this.onClickOutsideHandler = null;
        this.close();
        this.isVisible = false;
    }

    /**
     *  Execute a callback for a fired event listener
     */
    on (type, callback) {
        this.listeners[type] = callback;
    }

    onClickOutside (event) {
        // HACKY!!
        // A click event fires on the body after mousedown - mousemove, simultaneously with
        // mouseup. So if someone started a mouse action inside the color picker modal and then
        // mouseup'd outside of it, it fires a click event on the body, thus, causing the
        // modal to disappear when the user does not expect it to, since the mouse down event
        // did not start outside the modal.
        // There might be (or should be) a better way to track this, but right now, just cancel
        // the event if the target ends up being on the body directly rather than on one of the
        // other child elements.
        if (event.target === document.body) {
            return;
        }
        // end this specific hacky part

        let target = event.target;

        while (target !== document.documentElement && !target.classList.contains(this.CSS_PREFIX+'modal')) {
            target = target.parentNode;
        }

        if (!target.classList.contains(this.CSS_PREFIX+'modal')) {
            this.removeModal();
        }
    }
}

