'use strict';

import Modal from 'app/ui/modals/Modal'
import Pos from 'app/tools/Pos';
import { addEvent, removeEvent, getDomOrigin } from 'app/tools/common'

let startPoint;
let domCache;
const MODAL_VIEWPORT_EDGE_BUFFER = 20; // buffer zone at the viewport edge where a modal should not be presented

export default class TrackPadModal extends Modal {
    constructor (pos, properties) {
        super('trackpad-');

        properties = properties || {};
        this.width = properties.width || 200;
        this.height = properties.height || 200;
        this.min = properties.min || -1;
        this.max = properties.max || 1;
        this.size =  properties.size || 6;
        this.range = this.max - this.min;

        this.fnColor = 'rgb(230, 230, 230)';
        this.dimColor = 'rgb(100, 100, 100)';

        let center = ((this.range/2)-this.max)*-1;
        this.value = new Pos(pos || [center,center]);
    }

	init () {
        if (!domCache) {
            let modal = document.createElement('div');
            modal.className = this.CSS_PREFIX + 'modal';
            
            let canvas = document.createElement('canvas');
            canvas.id = this.CSS_PREFIX + 'canvas';
            
            modal.appendChild(canvas);
            domCache = modal;
        }

        // Returns a clone of the cached document fragment
        this.el = domCache.cloneNode(true);

        this.dom = {};
        this.dom.modal = this.el;
        this.dom.canvas = this.dom.modal.children[0];
	}

	draw () {
        if (this.value.x < this.min) this.value.x = this.min; 
        if (this.value.x > this.max) this.value.x = this.max; 
        if (this.value.y < this.min) this.value.y = this.min; 
        if (this.value.y > this.max) this.value.y = this.max;

        let canvas = this.dom.canvas;//document.getElementById(this.CSS_PREFIX + 'canvas');
        canvas.width = this.width;
        canvas.height = this.height;

        let ctx = canvas.getContext('2d');

        ctx.clearRect(-1,0,this.width,this.height+14);

        // frame
        ctx.strokeStyle = this.dimColor;
        ctx.lineWidth = 2.0;
        ctx.strokeRect(0, 0, this.width, this.height);

        // horizontal line
        ctx.strokeStyle = this.dimColor;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, 0.5+this.height*.5);
        ctx.lineTo(0+this.width, 0.5+this.height*.5);
        ctx.closePath();
        ctx.stroke();

        // vertical line
        ctx.beginPath();
        ctx.moveTo(0.5+this.width/2, 0);
        ctx.lineTo(0.5+this.width/2, this.height);
        ctx.closePath();
        ctx.stroke();

        let x = Math.round( ((this.value.x - this.min)/this.range)*this.width );
        let y = Math.round( ((1.-(this.value.y - this.min)/this.range))*this.height );

        let half = this.size/2;

        if (x < half) {
            x = half;
        }
        if (x > this.width-half) {
            x = this.width-half;
        }
        if (y < half) {
            y = half;
        }
        if (y > this.height-half) {
            y = this.height-half;
        }

        // point
        ctx.fillStyle = this.fnColor;
        ctx.fillRect(x-half, y-half, this.size, this.size);

        ctx.restore();
	}

    presentModal (x, y) {
        super.presentModal(x,y);

        // Check if desired x, y will be outside the viewport.
        // Do not allow the modal to disappear off the edge of the window.
        let modalXPos = (x + this.width < window.innerWidth) ? x : (window.innerWidth - MODAL_VIEWPORT_EDGE_BUFFER - this.width);
        let modalYPos = (y + this.height < window.innerHeight) ? y : (window.innerHeight - MODAL_VIEWPORT_EDGE_BUFFER - this.height);

        this.el.style.left = modalXPos + 'px';
        this.el.style.top = modalYPos + 'px';
        this.el.style.width = this.width + 'px';
        this.el.style.height = this.height + 'px';
        document.body.appendChild(this.el);

        this.onMouseDownHandler = addEvent(this.el, 'mousedown', this.onMouseDown, this);

        this.draw();
    }

    onMouseDown (event) {
        let target = event.target || event.srcElement;
        event.preventDefault();

        startPoint = getDomOrigin(target);

        // Starts listening for mousemove and mouseup events
        this.onMouseMoveHandler = addEvent(window, 'mousemove', this.onMouseMove, this);
        this.onMouseUpHandler = addEvent(window, 'mouseup', this.onMouseUp, this);

        this.onMouseMove(event);

        this.renderer.start();
    }

    // Actions when user moves around on HSV color map
    onMouseMove (event) {
        let x = event.clientX - startPoint.left;
        let y = event.clientY - startPoint.top;
        this.value.x = ((this.range/this.width)*x)-(this.range-this.max);
        this.value.y = (((this.range/this.height)*y)-(this.range-this.max))*-1.;

        // fire 'changed'
        if (this.listeners.changed && typeof this.listeners.changed === 'function') {
            this.listeners.changed(this.value);
        }
    }

    onMouseUp (event) {
        this.renderer.stop();
        this.destroyEvents();
    }

    // Destroy event listeners that exist during mousedown colorpicker interaction
    destroyEvents () {
        removeEvent(window, 'mousemove', this.onMouseMoveHandler);
        this.onMouseMoveHandler = null;
        removeEvent(window, 'mouseup', this.onMouseUpHandler);
        this.onMouseUpHandler = null;
    }

    close () {
        this.destroyEvents();
        removeEvent(this.el, 'mousedown', this.onMouseDownHandler);
        this.onHsvDownHandler = null;
    }

    setPos (pos) {
        this.value = new Pos(this.pos);
        this.draw();
    }

    getPos() {
        return this.value;
    }
}

