'use strict';

import Modal from 'app/ui/modals/Modal'
import Pos from 'app/tools/Pos';
import { addEvent, removeEvent, getDomOrigin } from 'app/tools/common'

let startPoint;
let domCache;
const MODAL_VIEWPORT_EDGE_BUFFER = 20; // buffer zone at the viewport edge where a modal should not be presented

export default class SliderModal extends Modal {
    constructor (number, properties) {
        super('slider-');

        properties = properties || {};
        this.width = properties.width || 250;
        this.height = properties.height || 40;
        
        this.fnColor = 'rgb(230, 230, 230)';
        this.dimColor = 'rgb(100, 100, 100)';

        this.prevOffset = 0;
        this.scale = 2;

        this.setValue(number);
        this.init();
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
        let canvas = this.dom.canvas;//document.getElementById(this.CSS_PREFIX + 'canvas');
        canvas.width = this.width;
        canvas.height = this.height;

        let ctx = canvas.getContext('2d');

        // horizontal line
        ctx.strokeStyle = this.dimColor;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, 0.5+this.height*.5);
        ctx.lineTo(0+this.width, 0.5+this.height*.5);
        ctx.closePath();
        ctx.stroke();

        // vertical line
        ctx.strokeStyle = this.fnColor;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(this.width*.5, 0);
        ctx.lineTo(this.width*.5, this.height);
        ctx.closePath();
        ctx.stroke();

        // Triangle line
        ctx.fillStyle = this.fnColor;
        ctx.beginPath();
        ctx.moveTo(this.width*.5, 5);
        ctx.lineTo(this.width*.48, 0);
        ctx.lineTo(this.width*.52, 0);
        ctx.closePath();
        ctx.fill();

        let times = 3;
        let unit = 40;
        let step = this.width/unit;
        let sections = unit*times;

        let offsetX = -this.offsetX;

        if (Math.abs(this.offsetX-this.width*.5) > this.width*.5) {
            offsetX = (this.offsetX-this.width*.5)%(this.width*.5);
        }

        ctx.strokeStyle = this.dimColor;
        ctx.beginPath();
        for (let i = 0; i < sections; i++) {
            let l = ( i%(unit/2) === 0)? this.height*.35 : ( i%(unit/4) === 0)? this.height*.2 : this.height*.1;
            ctx.moveTo(offsetX-this.width+i*step,this.height*.5-l);
            ctx.lineTo(offsetX-this.width+i*step,this.height*.5+l);
        }
        ctx.stroke();

        let val = Math.round(((this.value - this.min)/this.range)*this.width );

        // point
        ctx.strokeStyle = this.fnColor;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(this.offsetX+val, this.height*.5);
        ctx.lineTo(this.offsetX+val, this.height);
        ctx.closePath();
        ctx.stroke();

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
        let x = event.clientX - startPoint.left;
        let y = event.clientY - startPoint.top;

        this.prevOffset = x;
        console.log("start: ", this.prevOffset);

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

        console.log("X: ", x);
        let vel = x-this.prevOffset;
        let offset = this.offsetX - vel;
        console.log("Offset: ", offset);

        let center = this.width/this.scale;
        this.setValue(offset/center);
        this.prevOffset = x;
        
        // fire 'changed'
        if (this.listeners.changed && typeof this.listeners.changed === 'function') {
            this.listeners.changed(this.getValue().toFixed(3));
        }
    }

    onMouseUp (event) {
        this.renderer.stop();
        this.destroyEvents();
    }

    setValue (value) {
        if (typeof value === 'string') {
            this.value = parseFloat(value);
        }
        else if (typeof value === 'number') {
            this.value = value;
        }
        let center = (this.width/this.scale);
        this.offsetX = this.value*center;
        console.log("setValue: ",this.value, this.offsetX);
    }

    getValue () {
        return this.value;
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
        this.onMouseDownHandler = null;
    }
}

