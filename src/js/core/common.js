export function parseQuery (qstr) {
    let query = {};
    let a = qstr.split('&');
    for (let i in a) {
        let b = a[i].split('=');
        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
    }
    return query;
}

export function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        let context = this,
            args = arguments;
        let later = function() {
            timeout = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };
        let callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            func.apply(context, args);
        }
    };
}

export function getDOMOffset(dom) {
    let y = 0,
        x = 0;
    do {
        y += dom.offsetTop || 0;
        x += dom.offsetLeft || 0;
        dom = dom.offsetParent;
    } while (dom);

    return {
        y: y,
        x: x
    };
}

//  Check if a variable is a number
export function isNumber(n) {
    return /^-?[\d.]+(?:e-?\d+)?$/.test(n);
}

export function toCSS(str) {
    let match = str.match(/\[\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*(,\s*(\d\.|\d*\.?\d+)\s*)?\]/);
    if (match) {
        if (match[5]) {
            str = 'rgba(' + Math.round(match[1] * 255) + ',' +
                            Math.round(match[2] * 255) + ',' +
                            Math.round(match[3] * 255) + ',' +
                            Math.round(match[5] * 255) + ')';
        }
        else {
            str = 'rgb(' + Math.round(match[1] * 255) + ',' +
                            Math.round(match[2] * 255) + ',' +
                            Math.round(match[3] * 255) + ')';
        }
    }
    else if (isNumber(str)) {
        let val = Math.round(parseFloat(str) * 255);
        str = 'rgb(' + val + ',' + val + ',' + val + ')';
    }
    else if (/^\s*[\'|\"]#[0-9a-f]{3}(?:[0-9a-f]{3})?[\'|\"]\s*$/i.test(str)) {
        let value = /[\'|\"]([\w|\W|\s]+)[\'|\"]/gm.exec(str);
        return value ? value[1] : '';
    }
    else if (/\'(\w+)\'/.test(str)) {
        let value = /[\'|\"]([\w|\W|\s]+)[\'|\"]/gm.exec(str);
        return value ? value[1] : '';
    }
    return str;
}

export function toColorVec(str) {
    let match = str.match(/\[\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*(,\s*(\d\.|\d*\.?\d+)\s*)?\]/);
    if (match) {
        if (match[5]) {
            return { r:match[1],g:match[2],b:match[3],a:match[5] };
        }
        else {
            return { r:match[1],g:match[2],b:match[3] };
        }
    }
    else if (isNumber(str)) {
        let val = parseFloat(str);
        return { r:val,g:val,b:val };
    }
    else if (/^\s*[\'|\"]#[0-9a-f]{3}(?:[0-9a-f]{3})?[\'|\"]\s*$/i.test(str)) {
        let value = /[\'|\"]([\w|\W|\s]+)[\'|\"]/gm.exec(str);
        return value ? { w:value[1] } : {};
    }
}

export class StopWatch {
    constructor (performance) {
        this.startTime = 0;
        this.stopTime = 0;
        this.running = false;
        this.performance = performance === false ? false : !window.performance;
    }

    currentTime() {
        return this.performance ? window.performance.now() : new Date().getTime();
    }

    start() {
        this.startTime = this.currentTime();
        this.running = true;
    }

    stop() {
        this.stopTime = this.currentTime();
        this.running = false;
    }

    getElapsedMilliseconds() {
        if (this.running) {
            this.stopTime = this.currentTime();
        }
        return this.stopTime - this.startTime;
    }

    getElapsedSeconds() {
        return this.getElapsedMilliseconds() / 1000;
    }

    printElapsed(name) {
        let currentName = name || 'Elapsed:';
        console.log(currentName, '[' + this.getElapsedMilliseconds() + 'ms]', '[' + this.getElapsedSeconds() + 's]');
    }
}

export function subscribeMixin (target) {
    var listeners = new Set();

    return Object.assign(target, {

        subscribe(listener) {
            listeners.add(listener);
        },

        on(type, f) {
            let listener = {};
            listener[type] = f;
            listeners.add(listener);
        },

        unsubscribe(listener) {
            listeners.delete(listener);
        },

        unsubscribeAll() {
            listeners.clear();
        },

        trigger(event, ...data) {
            for (var listener of listeners) {
                if (typeof listener[event] === 'function') {
                    listener[event](...data);
                }
            }
        }
    });
}

export function createObjectURL (string) {
    let create = (window.URL && window.URL.createObjectURL) || (window.webkitURL && window.webkitURL.createObjectURL); // for Safari compatibliity
    return create(new Blob([string]));
}
