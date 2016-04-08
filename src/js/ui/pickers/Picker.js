/*
Original: https://github.com/tangrams/tangram-play/blob/gh-pages/src/js/addons/ui/widgets/ColorPickerModal.js
Author: Lou Huang (@saikofish)
*/

import { getDevicePixelRatio } from '../../tools/common';
import { subscribeMixin } from '../../tools/mixin';

export default class Picker {
    constructor (CSS_PREFIX, properties) {
        subscribeMixin(this);
        this.CSS_PREFIX = CSS_PREFIX;

        this.bgColor = 'rgb(46, 48, 51)';
        this.dimColor = 'rgb(100, 100, 100)';
        this.fnColor = 'rgb(230, 230, 230)';
        this.selColor = 'rgb(133, 204, 196)';

        properties = properties || {};
        for (let prop in properties) {
            this[prop] = properties[prop];
        }

        /**
         *  This initializes the renderer. It uses requestAnimationFrame() to
         *  smoothly render changes in the color picker as user interacts with it.
         */
        this.renderer = {
            // Stores a reference to the animation rendering loop.
            frame: null,

            drawFrame: () => {
                if (!this.el) {
                    return;
                }
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

    create () {
        this.el = document.createElement('div');
        this.el.className = this.CSS_PREFIX + 'modal ge_picker_modal';
        this.el.style.backgroundColor = this.bgColor;

        this.canvas = document.createElement('canvas');
        this.canvas.className = this.CSS_PREFIX + 'canvas ge_picker_canvas';
        this.canvas.style.backgroundColor = this.bgColor;

        this.el.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        let ratio = getDevicePixelRatio(this.ctx);
        this.canvas.width = this.width * ratio;
        this.canvas.height = this.height * ratio;
        this.ctx.scale(ratio, ratio);
    }

    draw () {
        // render rutine
    }

    close () {
        // Close rutine
        this.destroyEvents();
        removeEvent(this.el, 'mousedown', this.onMouseDownHandler);
        this.onMouseDownHandler = null;
    }

    destroyEvents () {
        removeEvent(this.el, 'mousemove', this.onMouseMoveHandler);
        this.onMouseMoveHandler = null;
        removeEvent(window, 'mouseup', this.onMouseUpHandler);
        this.onMouseUpHandler = null;
    }

    setValue (value) {
        this.value = value;
    }

    getValue () {
        return this.value;
    }

    showAt (cm) {
        let cursor = cm.cursorCoords(true, 'page');
        let x = cursor.left;
        let y = cursor.top;

        x -= this.width * 0.5;
        y += 30;

        // // Check if desired x, y will be outside the viewport.
        // // Do not allow the modal to disappear off the edge of the window.
        // x = (x + this.width < window.innerWidth) ? x : (window.innerWidth - 20 - this.width);
        // y = (y + this.height < window.innerHeight) ? y : (window.innerHeight - 20 - this.height);

        this.presentModal(x, y);
    }

    presentModal (x, y) {
        // Listen for interaction outside of the modal
        window.setTimeout(() => {
            this.onClickOutsideHandler = addEvent(document.body, 'click', this.onClickOutside, this);
            this.onKeyPressHandler = addEvent(window, 'keydown', this.onKeyPress, this);
        }, 0);
        this.isVisible = true;

        this.el.style.left = x + 'px';
        this.el.style.top = y + 'px';
        this.el.style.width = this.width + 'px';
        this.el.style.height = this.height + 'px';
        document.body.appendChild(this.el);

        this.onMouseDownHandler = addEvent(this.el, 'mousedown', this.onMouseDown, this);

        this.renderer.drawFrame();
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
        removeEvent(window, 'keydown', this.onKeyPressHandler);
        this.onKeyPressHandler = null;

        this.close();
        this.isVisible = false;
    }

    onKeyPress (event) {
        this.removeModal();
    }

    onClickOutside (event) {
        // HACKY!!
        // A click event fires on the body after mousedown - mousemove, simultaneously with
        // mouseup. So if someone started a mouse action inside the modal and then
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

        while (target !== document.documentElement && !target.classList.contains(this.CSS_PREFIX + 'modal')) {
            target = target.parentNode;
        }

        if (!target.classList.contains(this.CSS_PREFIX + 'modal')) {
            this.removeModal();
        }
    }

    onMouseDown (event) {
        event.preventDefault();

        // Starts listening for mousemove and mouseup events
        this.onMouseMoveHandler = addEvent(this.el, 'mousemove', this.onMouseMove, this);
        this.onMouseUpHandler = addEvent(window, 'mouseup', this.onMouseUp, this);

        this.onMouseMove(event);

        this.renderer.start();
    }

    onMouseMove (event) {
    }

    onMouseUp (event) {
        this.renderer.stop();
        this.destroyEvents();
    }
}

/* Event handling */
export function addEvent (element, event, callback, caller) {
    let handler;
    element.addEventListener(event, handler = function (e) {
        callback.call(caller, e);
    }, false);
    return handler;
}

export function removeEvent (element, event, callback) {
    element.removeEventListener(event, callback, false);
}
