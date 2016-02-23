'use strict';

import Picker from './Picker'
import { addEvent, removeEvent } from './events'

let domCache;
const MODAL_VIEWPORT_EDGE_BUFFER = 20; // buffer zone at the viewport edge where a modal should not be presented

export default class FloatPicker extends Picker {
    constructor (number, properties) {
        super('slider-', properties);
    
        this.width = 250;
        this.height = 40;
        
        this.fnColor = 'rgb(230, 230, 230)';
        this.dimColor = 'rgb(100, 100, 100)';

        this.prevOffset = 0;
        this.scale = 2;

        this.setValue(number|| 1.);
        this.create();
    }

	draw () {
        this.ctx.clearRect(0,0,this.width,this.height);

        // horizontal line
        this.ctx.strokeStyle = this.dimColor;
        this.ctx.lineWidth = 1.0;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0.5+this.height*.5);
        this.ctx.lineTo(0+this.width, 0.5+this.height*.5);
        this.ctx.closePath();
        this.ctx.stroke();

        // vertical line
        this.ctx.strokeStyle = this.fnColor;
        this.ctx.lineWidth = 1.0;
        this.ctx.beginPath();
        this.ctx.moveTo(this.width*.5, 0);
        this.ctx.lineTo(this.width*.5, this.height);
        this.ctx.closePath();
        this.ctx.stroke();

        // Triangle line
        this.ctx.fillStyle = this.fnColor;
        this.ctx.beginPath();
        this.ctx.moveTo(this.width*.5, 5);
        this.ctx.lineTo(this.width*.48, 0);
        this.ctx.lineTo(this.width*.52, 0);
        this.ctx.closePath();
        this.ctx.fill();

        let times = 3;
        let unit = 40;
        let step = this.width/unit;
        let sections = unit*times;

        let offsetX = this.offsetX;

        if (Math.abs(this.offsetX-this.width*.5) > this.width*.5) {
            offsetX = (this.offsetX-this.width*.5)%(this.width*.5)+this.width;
        }

        this.ctx.strokeStyle = this.dimColor;
        this.ctx.beginPath();
        for (let i = 0; i < sections; i++) {
            let l = ( i%(unit/2) === 0)? this.height*.35 : ( i%(unit/4) === 0)? this.height*.2 : this.height*.1;
            this.ctx.moveTo(i*step-offsetX,this.height*.5-l);
            this.ctx.lineTo(i*step-offsetX,this.height*.5+l);
        }
        this.ctx.stroke();

        let val = Math.round(((this.value - this.min)/this.range)*this.width );

        // point
        this.ctx.strokeStyle = this.fnColor;
        this.ctx.lineWidth = 1.0;
        this.ctx.beginPath();
        this.ctx.moveTo(this.offsetX+val, this.height*.5);
        this.ctx.lineTo(this.offsetX+val, this.height);
        this.ctx.closePath();
        this.ctx.stroke();

        this.ctx.restore();
	}

    onMouseDown (event) {
        this.prevOffset = event.offsetX;
        super.onMouseDown(event);
    }

    // Actions when user moves around on HSV color map
    onMouseMove (event) {
        let x = event.offsetX;
        let y = event.offsetY;

        let vel = x-this.prevOffset;
        let offset = this.offsetX - vel;

        let center = this.width/this.scale;
        this.setValue(offset/center);
        this.prevOffset = x;
        
        // fire 'changed'
        this.trigger('changed', this.getValue().toFixed(3));
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
    }
}

