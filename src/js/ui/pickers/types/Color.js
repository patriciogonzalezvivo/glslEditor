import ColorConverter from './ColorConverter';
import { getColorAsRGB, getValueRanges, getLuminance, limitValue } from './ColorConverter';

export default class Color {
    constructor (color) {
        this.colors = {};
        this.set(color);
    }

    set (color, type) { // color only full range
        if (typeof color === 'number') {
            type = type ? type : 'rgb';
            this.colors[type] = {};
            for (var n = 3; n--;) {
                let m = type[n] || type.charAt(n); // IE7
                this.colors[type][m] = color;
            }
        }
        else if (typeof color === 'string') {
            let parts = color.replace(/(?:#|\)|%)/g, '').split('(');
            if (parts[1]) {
                let values = (parts[1] || '').split(/,\s*/);
                type = type ? type : (parts[1] ? parts[0].substr(0, 3) : 'rgb');
                this.set(values, type);
            }
            else {
                this.set(getColorAsRGB(color), 'rgb');
            }
        }
        else if (color) {
            if (Array.isArray(color)) {
                let m = '';
                type = type || 'rgb';

                this.colors[type] = this.colors[type] || {};
                for (let n = 3; n--;) {
                    m = type[n] || type.charAt(n); // IE7
                    let i = color.length >= 3 ? n : 0;
                    this.colors[type][m] = parseFloat(color[i]);
                }

                if (color.length === 4) {
                    this.colors.alpha = parseFloat(color[3]);
                }
            }
            else if (type) {
                for (let n in color) {
                    this.colors[type][n] = limitValue(color[n] / getValueRanges(type)[n][1], 0, 1) * getValueRanges(type)[n][1];
                }
            }
        }

        if (!type) {
            return;
        }

        if (type !== 'rgb') {
            var convert = ColorConverter;
            this.colors.rgb = convert[type + '2rgb'](this.colors[type]);
        }
        this.convert(type);
        this.colors.hueRGB = ColorConverter.hue2RGB(this.colors.hsv.h);
        this.colors.luminance = getLuminance(this.colors.rgb);
    }

    convert (type) {
        let convert = ColorConverter,
            ranges = getValueRanges(),
            exceptions = { hsl: 'hsv', cmyk: 'cmy', rgb: type };

        if (type !== 'alpha') {
            for (let typ in ranges) {
                if (!ranges[typ][typ]) { // no alpha|HEX
                    if (type !== typ && typ !== 'XYZ') {
                        let from = exceptions[typ] || 'rgb';
                        this.colors[typ] = convert[from + '2' + typ](this.colors[from]);
                    }
                }
            }
        }
    }

    get (type) {
        if (type !== 'rgb') {
            var convert = ColorConverter;
            this.colors[type] = convert['rgb2' + type](this.colors['rgb']);
            return this.colors[type];
        }
        else {
            return this.colors['rgb'];
        }
    }

    getString (type) {
        if (type === 'HEX') {
            var convert = ColorConverter;
            return convert['rgb2' + type](this.colors['rgb']);
        }
        else {
            let color = this.get(type);
            let str = type,
                m = '';
            if (type === 'vec') {
                str += this.colors.alpha ? 4 : 3;
            }
            str += '(';
            for (let n = 0; n < 3; n++) {
                m = type[n] || type.charAt(n); // IE7
                if (type === 'vec') {
                    str += (color[m]).toFixed(3);
                }
                else {
                    str += Math.floor(color[m]);
                }
                if (n !== 2) {
                    str += ',';
                }
            }

            if (this.colors.alpha) {
                str += ',' + (this.colors.alpha).toFixed(3);
            }
            return str += ')';
        }
    }

    uniformType () {
        if (this.colors.alpha) {
            return 'vec4';
        }
        return 'vec3';
    }

    uniformValue () {
        var vec = this.get('vec');
        var arr = [vec.v, vec.e, vec.c];
        if (this.colors.alpha) {
            arr.push(this.colors.alpha);
        }
        return arr;
    }

    uniformMethod (type) {
        if (this.colors.alpha) {
            return '4f';
        }
        return '3f';
    }
}
