'use strict'

export default class Pos {
    constructor (pos) {
        this.value = [0,0];
        this.dim = 2;
        this.set(pos);
    }

    set (pos, type) {
        if (typeof pos === 'number') {
            type = type || 'vec2';
            this.set([pos],type);
        }
        else if (typeof pos === 'string') {
            let parts = pos.replace(/(?:#|\)|%)/g, '').split('(');
            let strValues = (parts[1] || '').split(/,\s*/);
            type = type || (parts[1] ? parts[0].substr(0, 4) : 'vec2');
            let values = [];
            for (let i in strValues) {
                values.push(parseFloat(strValues[i])); 
            }
            this.set(values,type);
        }
        else if (pos) {
            if (Array.isArray(pos)) {
                this.value = pos;
                this.dim = type ? Number(type.substr(3, 4)) : pos.length;
                while (this.value.length < this.dim ) {
                    this.value.push(this.value[0]);
                }
            }
            else if (pos.dim) {
                this.value = pos.value;
                this.dim = pos.dim;
            }
        }
    }

    set x (v) {
        this.value[0] = v;
    }

    set y (v) {
        this.value[1] = v;
    }

    set z (v) {
        if (this.dim < 3) {
            this.value.push(v);
            this.dim = 3;
        }
        else {
            this.value[2] = v;
        }
    }

    set w (v) {
        while (this.dim < 4) {
            this.value.push(0);
        }
        this.dim = this.value.length;
        this.value[3] = v;
    }

    get x () {
        return this.value[0];
    }

    get y () {
        return this.value[1];
    }

    get z () {
        return this.value[2];
    }

    get w () {
        return this.value[2];
    }

    getString(type) {
        type = type || 'vec' + this.dim;
        
        let str = type + '(';
        for (let n = 0; n < this.dim; n++) {
            str += this.value[n].toFixed(3);
            if (n !== this.dim-1) {
                str +=',';
            }
        }
        return str+= ')';
    }
}