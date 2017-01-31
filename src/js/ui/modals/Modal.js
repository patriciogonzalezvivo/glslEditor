import { subscribeMixin } from '../../tools/mixin';

export default class Modal {
    constructor (CSS_PREFIX, properties) {
        subscribeMixin(this);
        this.CSS_PREFIX = CSS_PREFIX;

        properties = properties || {};
        for (let prop in properties) {
            this[prop] = properties[prop];
        }

        this.el = document.createElement('div');
        this.el.className = this.CSS_PREFIX + '_modal ge_modal';
        this.el.style.backgroundColor = this.bgColor;
        this.el.innerHTML = this.innerHTML || '';

        if (this.elements) {
            for (let i = 0; i < this.elements.length; i++) {
                this.el.appendChild(this.elements[i]);
            }
        }

        this.isVisible = false;
    }

    close () {
        this.trigger('close');
    }

    showAt (cm) {
        let cursor = cm.cursorCoords(true, 'page');
        let x = cursor.left;
        let y = cursor.top;

        y += 30;

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

        if (this.position) {
            this.el.style.position = this.position;
        }

        document.body.appendChild(this.el);

        this.trigger('show');
    }

    getModalClass() {
        return this.CSS_PREFIX + 'modal';
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
        if (target) {
            while (target !== document.documentElement && !target.classList.contains(this.getModalClass())) {
                target = target.parentNode;
            }

            if (!target.classList.contains(this.getModalClass())) {
                this.removeModal();
            }    
        }
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
