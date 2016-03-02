export function getDomOrigin (el) {
    const box = (el.getBoundingClientRect) ? el.getBoundingClientRect() : { top: 0, left: 0 };
    const doc = el && el.ownerDocument;
    const body = doc.body;
    const win = doc.defaultView || doc.parentWindow || window;
    const docElem = doc.documentElement || body.parentNode;
    const clientTop = docElem.clientTop || body.clientTop || 0; // border on html or body or both
    const clientLeft = docElem.clientLeft || body.clientLeft || 0;

    return {
        left: box.left + (win.pageXOffset || docElem.scrollLeft) - clientLeft,
        top: box.top + (win.pageYOffset || docElem.scrollTop) - clientTop
    };
}

export function getDevicePixelRatio (ctx) {
    let devicePixelRatio = window.devicePixelRatio || 1;
    let backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                            ctx.mozBackingStorePixelRatio ||
                            ctx.msBackingStorePixelRatio ||
                            ctx.oBackingStorePixelRatio ||
                            ctx.backingStorePixelRatio || 1;
    return devicePixelRatio / backingStoreRatio;
}
