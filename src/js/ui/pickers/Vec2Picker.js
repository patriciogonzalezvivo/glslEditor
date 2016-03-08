import Picker from './Picker';
import Vector from './types/Vector';

export default class Vec2Picker extends Picker {
    constructor (pos, properties) {
        super('ge_vec2picker_', properties);

        this.width = this.width || 200;
        this.height = this.height || 200;

        this.min = this.min || -1;
        this.max = this.max || 1;
        this.size = this.size || 6;
        this.range = this.max - this.min;
        this.overPoint = false;

        let center = ((this.range / 2) - this.max) * -1;
        this.setValue(pos || [center,center]);
        this.create();
    }

    draw () {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // frame
        this.ctx.strokeStyle = this.dimColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.width, this.height);

        this.ctx.beginPath();
        this.ctx.lineWidth = 0.25;
        let sections = 20;
        let step = this.width / sections;
        for (let i = 0; i < sections; i++) {
            this.ctx.moveTo(i * step, 0);
            this.ctx.lineTo(i * step, this.height);
            this.ctx.moveTo(0, i * step);
            this.ctx.lineTo(this.width, i * step);
        }
        this.ctx.stroke();

        // horizontal line
        this.ctx.strokeStyle = this.dimColor;
        this.ctx.lineWidth = 1.0;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0.5 + this.height * 0.5);
        this.ctx.lineTo(this.width, 0.5 + this.height * 0.5);
        this.ctx.closePath();
        this.ctx.stroke();

        // vertical line
        this.ctx.beginPath();
        this.ctx.moveTo(0.5 + this.width * 0.5, 0);
        this.ctx.lineTo(0.5 + this.width * 0.5, this.height);
        this.ctx.closePath();
        this.ctx.stroke();

        // // Triangle line
        // this.ctx.fillStyle = this.dimColor;
        // this.ctx.beginPath();
        // this.ctx.moveTo(this.width * 0.5, 5);
        // this.ctx.lineTo(this.width * 0.48, 0);
        // this.ctx.lineTo(this.width * 0.52, 0);
        // this.ctx.closePath();
        // this.ctx.fill();

        let x = Math.round(((this.value.x - this.min) / this.range) * this.width);
        let y = Math.round(((1 - (this.value.y - this.min) / this.range)) * this.height);

        let half = this.size / 2;

        if (x < half) {
            x = half;
        }
        if (x > this.width - half) {
            x = this.width - half;
        }
        if (y < half) {
            y = half;
        }
        if (y > this.height - half) {
            y = this.height - half;
        }

        // point
        this.ctx.fillStyle = this.overPoint ? this.selColor : this.fnColor;
        this.ctx.beginPath();
        let radius = this.overPoint ? 4 : 2;
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        this.ctx.fill();

        this.ctx.restore();
        this.overPoint = false;
    }

    // Actions when user moves around on HSV color map
    onMouseMove (event) {
        let x = event.offsetX;
        let y = event.offsetY;

        this.value.x = ((this.range / this.width) * x) - (this.range - this.max);
        this.value.y = (((this.range / this.height) * y) - (this.range - this.max)) * -1;

        // fire 'changed'
        this.trigger('changed', this.value);
        this.overPoint = true;
    }

    setValue (pos) {
        this.value = new Vector(pos);
    }
}
