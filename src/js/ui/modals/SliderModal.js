'use strict';

import Modal from 'app/ui/modals/Modal'
import Pos from 'app/tools/Pos';
import { addEvent, removeEvent, getDomOrigin } from 'app/tools/common'

let startPoint;
let domCache;
const MODAL_VIEWPORT_EDGE_BUFFER = 20; // buffer zone at the viewport edge where a modal should not be presented

export default class SliderModal extends Modal {
    constructor (number, properties) {
        super('trackpad-');

        properties = properties || {};
        this.width = properties.width || 250;
        this.height = properties.height || 50;
        
        this.fnColor = 'rgb(230, 230, 230)';
        this.dimColor = 'rgb(100, 100, 100)';

        this.start = 0;
        this.range = 2;

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
        // ctx.clearRect(-1,0,this.width,this.height+14);

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

        let times = 3;
        let unit = 100;
        let step = this.width/unit;
        let sections = unit*times;

        let offset = this.offset;
        let offsetX = this.offsetX;
        let offsetI = 0;
        let min = this.min;
        let max = this.max;

        if (Math.abs(this.offsetX-this.width*.5) > this.width*.5) {
            offsetX = (this.offsetX-this.width*.5)%(this.width*.5);
        //     offsetI =  Math.floor(this.offsetX/(this.width));
        //     console.log('integer offset ',offsetI, offsetX);
        }

        // console.log(min,this.offset,max);
        ctx.beginPath();
        for (let i = 0; i < sections; i++) {
            let y1 = ( i%(unit/2) === 0)? 5 : 0;
            let y2 = ( i%(unit/2) === 0)? 20 : ( i%(unit/4) === 0)? 15 : 10;
            ctx.moveTo(offsetX-this.width+i*step,this.height*.5-y1);
            ctx.lineTo(offsetX-this.width+i*step,this.height*.5+y2);
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

        ctx.fillStyle = this.dimColor;
        ctx.font = '10px Arial';
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "center";
        ctx.fillText(Math.floor(this.integer-1-offsetI), offsetX, this.height*.3);
        ctx.fillText(Math.floor(this.integer-offsetI),offsetX+this.width*0.5, this.height*.3);
        ctx.fillText(Math.floor(this.integer+1-offsetI), offsetX+this.width, this.height*.3);

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
        if (y < this.height*.5) {
            this.start = x-this.offsetX;
        }

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

        if (y < this.height*.5) {
            this.offsetX = x-this.start;
            this.offset = ((this.range/this.width)*this.offsetX)-(this.range-this.max);
        } else {
            x -= this.width*.5+this.offsetX;
            this.fraction = ((this.range/this.width)*x)-(this.range-this.max);
        }
        
        // fire 'changed'
        if (this.listeners.changed && typeof this.listeners.changed === 'function') {
            this.listeners.changed(this.getValue().toFixed(3));
        }
    }

    setValue (value) {
        if (typeof value === 'string') {
            this.value = parseFloat(value);
        }
        else if (typeof value === 'number') {
            this.value = value;
        }
        
        this.integer = Math.floor(this.value);
        this.fraction = this.value % 1;

        this.offsetX = 0;
        this.min = this.integer-1;
        this.max = this.integer+1;
        this.offset = 0;
    }

    getValue () {
        this.value = this.integer + this.fraction;
        return this.value;
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
        this.onMouseDownHandler = null;
    }
}

