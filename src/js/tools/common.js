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

export function getJSON(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 200) {
        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
};
