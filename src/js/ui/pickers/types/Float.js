
export default class Float {
    constructor (value) {
        this.value = value;
    }

    getString () {
        return this.value.toFixed(3);
    }

    uniformType () {
        return 'float';
    }

    uniformValue () {
        return [this.value];
    }

    uniformMethod () {
        return '1f';
    }
}
