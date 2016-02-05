'use strict';

import Modal from 'app/ui/modals/Modal'
import Pos from 'app/tools/Pos';
import { addEvent, removeEvent, getDomOrigin } from 'app/tools/common'

let domCache;

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

        ctx.beginPath();
        ctx.lineWidth = .25;
        let sections = 20;
        let step = this.width/sections;
        for (let i = 0; i < sections; i++) {
            ctx.moveTo(i*step,0);
            ctx.lineTo(i*step,this.height);
            ctx.moveTo(0,i*step);
            ctx.lineTo(this.width,i*step);
        }
        ctx.stroke();

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
        ctx.moveTo(0.5+this.width*.5, 0);
        ctx.lineTo(0.5+this.width*.5, this.height);
        ctx.closePath();
        ctx.stroke();

        // Triangle line
        ctx.fillStyle = this.dimColor;
        ctx.beginPath();
        ctx.moveTo(this.width*.5, 5);
        ctx.lineTo(this.width*.48, 0);
        ctx.lineTo(this.width*.52, 0);
        ctx.closePath();
        ctx.fill();

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

        this.el.style.left = x + 'px';
        this.el.style.top = y + 'px';
        this.el.style.width = this.width + 'px';
        this.el.style.height = this.height + 'px';
        document.body.appendChild(this.el);

        this.onMouseDownHandler = addEvent(this.el, 'mousedown', this.onMouseDown, this);

        this.draw();
    }

    onMouseDown (event) {
        let target = event.target || event.srcElement;
        event.preventDefault();

        // Starts listening for mousemove and mouseup events
        this.onMouseMoveHandler = addEvent(this.el, 'mousemove', this.onMouseMove, this);
        this.onMouseUpHandler = addEvent(window, 'mouseup', this.onMouseUp, this);

        this.onMouseMove(event);

        this.renderer.start();
    }

    // Actions when user moves around on HSV color map
    onMouseMove (event) {
        let x = event.offsetX;
        let y = event.offsetY;

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
        removeEvent(this.el, 'mousemove', this.onMouseMoveHandler);
        this.onMouseMoveHandler = null;
        removeEvent(window, 'mouseup', this.onMouseUpHandler);
        this.onMouseUpHandler = null;
    }

    close () {
        this.destroyEvents();
        removeEvent(this.el, 'mousedown', this.onMouseDownHandler);
        this.onMouseDownHandler = null;
    }

    setPos (pos) {
        this.value = new Pos(this.pos);
        this.draw();
    }

    getPos() {
        return this.value;
    }
}

