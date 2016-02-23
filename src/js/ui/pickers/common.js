'use strict';

// Thanks Lou Huang 
// https://github.com/louh/bart/blob/gh-pages/main.js#L327-L335
export function getDevicePixelRatio (ctx) {
    let devicePixelRatio = window.devicePixelRatio || 1
    let backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                            ctx.mozBackingStorePixelRatio ||
                            ctx.msBackingStorePixelRatio ||
                            ctx.oBackingStorePixelRatio ||
                            ctx.backingStorePixelRatio || 1
    return devicePixelRatio / backingStoreRatio
}

 /* Event handling */
export function addEvent (element, event, callback, caller) {
    let handler;
    element.addEventListener(event, handler = function (e) {
        callback.call(caller, e);
    }, false);
    return handler;
}

export function removeEvent (element, event, callback) {
    element.removeEventListener(event, callback, false);
}