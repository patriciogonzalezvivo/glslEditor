/*
Add events to a class or object:
    class MyClass {
        constructor() {
            subscribeMixin(this); // Add the mixing functions to the class
            ...
            this.trigger('something', { owner: this, content: 'that'}); // trigger an event passing some arguments

Subscribe to events by doing:
    myClass.on('something', (args) => {
        console.log(args);
    });

Unsubscribe to events by doing:
    myClass.off('something');

or more presicelly:
    myClass.off('something', (args) => {
        console.log(args);
    });

Unsubscribe to all events by:
    myClass.offAll();
*/

export function subscribeMixin (target) {
    var listeners = new Set();

    return Object.assign(target, {

        on (type, f) {
            let listener = {};
            listener[type] = f;
            listeners.add(listener);
        },

        off (type, f) {
            if (f) {
                let listener = {};
                listener[type] = f;
                listeners.delete(listener);
            }
            else {
                for (let item of listeners) {
                    for (let key of Object.keys(item)) {
                        if (key === type) {
                            listeners.delete(item);
                            return;
                        }
                    }
                }
            }
        },

        offAll () {
            listeners.clear();
        },

        trigger (event, ...data) {
            for (var listener of listeners) {
                if (typeof listener[event] === 'function') {
                    listener[event](...data);
                }
            }
        },

        listSubscriptions () {
            for (let item of listeners) {
                console.log(item);
            }
        }
    });
}
