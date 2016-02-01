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
            let values = (parts[1] || '').split(/,\s*/);
            type = type || (parts[1] ? parts[0].substr(0, 4) : 'vec2');
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
}