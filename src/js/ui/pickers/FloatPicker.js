import Picker from './Picker';
import Float from './types/Float';

export default class FloatPicker extends Picker {
    constructor (number, properties) {
        super('ge_floatpicker_', properties);

        this.width = this.width || 250;
        this.height = this.height || 40;

        this.prevOffset = 0;
        this.scale = 2;

        this.setValue(number || 1);
        this.create();
    }

    draw () {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // horizontal line
        this.ctx.strokeStyle = this.dimColor;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0.5 + this.height * 0.5);
        this.ctx.lineTo(0 + this.width, 0.5 + this.height * 0.5);
        this.ctx.closePath();
        this.ctx.stroke();

        // vertical line
        this.ctx.strokeStyle = this.fnColor;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.width * 0.5, 0);
        this.ctx.lineTo(this.width * 0.5, this.height);
        this.ctx.closePath();
        this.ctx.stroke();

        // Triangle line
        this.ctx.fillStyle = this.overPoint ? this.selColor : this.fnColor;
        this.ctx.beginPath();
        this.ctx.moveTo(this.width * 0.5, 5);
        this.ctx.lineTo(this.width * 0.48, 0);
        this.ctx.lineTo(this.width * 0.52, 0);
        this.ctx.closePath();
        this.ctx.fill();

        let times = 3;
        let unit = 40;
        let step = this.width / unit;
        let sections = unit * times;

        let offsetX = this.offsetX;

        if (Math.abs(this.offsetX - this.width * 0.5) > this.width * 0.5) {
            offsetX = (this.offsetX - this.width * 0.5) % (this.width * 0.5) + this.width;
        }

        this.ctx.strokeStyle = this.dimColor;
        this.ctx.beginPath();
        for (let i = 0; i < sections; i++) {
            let l = (i % (unit / 2) === 0) ? this.height * 0.35 : (i % (unit / 4) === 0) ? this.height * 0.2 : this.height * 0.1;
            this.ctx.moveTo(i * step - offsetX, this.height * 0.5 - l);
            this.ctx.lineTo(i * step - offsetX, this.height * 0.5 + l);
        }
        this.ctx.stroke();

        let val = Math.round(((this.value - this.min) / this.range) * this.width);

        // point
        this.ctx.strokeStyle = this.overPoint ? this.selColor : this.fnColor;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.offsetX + val, this.height * 0.5);
        this.ctx.lineTo(this.offsetX + val, this.height);
        this.ctx.closePath();
        this.ctx.stroke();

        this.overPoint = false;
    }

    onMouseDown (event) {
        this.prevOffset = event.offsetX;
        super.onMouseDown(event);
    }

    // Actions when user moves around on HSV color map
    onMouseMove (event) {
        let x = event.offsetX;

        let vel = x - this.prevOffset;
        let offset = this.offsetX - vel;

        let center = this.width / this.scale;
        this.setValue(offset / center);
        this.prevOffset = x;

        // fire 'changed'
        var number = new Float(this.getValue());
        this.trigger('changed', number);
        this.overPoint = true;
    }

    setValue (value) {
        if (typeof value === 'string') {
            this.value = parseFloat(value);
        }
        else if (typeof value === 'number') {
            this.value = value;
        }
        let center = (this.width / this.scale);
        this.offsetX = this.value * center;
    }
}

