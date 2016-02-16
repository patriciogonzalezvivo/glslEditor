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