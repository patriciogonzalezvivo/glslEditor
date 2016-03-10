/*
Original: https://github.com/tangrams/tangram-play/blob/gh-pages/src/js/addons/LocalStorage.js
Author: Lou Huang (@saikofish)
*/

/**
 *  Local storage
 *
 *  Provides a common interface for the application where modules can
 *  request storage of values across multiple user sessions via the
 *  browser's LocalStorage API.
 *
 *  Browser support is good, so no fallbacks are implemented.
 *  This module manages namespacing for Tangram Play to prevent name
 *  collisions with other libraries, browser extensions, etc.
 */
const LOCAL_STORAGE_PREFIX = 'glslEditor-';

const LocalStorage = {
    /**
     *  setItem()
     *  Namespaces key name to Tangram Play application and adds
     *  the value to LocalStorage.
     */
    setItem (key, value) {
        if (window.localStorage) {
            window.localStorage.setItem(LOCAL_STORAGE_PREFIX + key, value);
        }
    },

    /**
     *  pushItem()
     *  Store values as an array. If the key doesn't exist as an object, create it.
     *  Note that this overwrites an old value if it is present and not a JSON object!
     *  If it exists, retreive it, serialize it into JSON, push the new value,
     *  re-encode to a string and then set it back in localStorage.
     *  No other array methods are implemented. If you need to delete items, etc
     *  then retrieve the string as normal, do the work in your script, and then
     *  set it to the new stringified array instead of pushing it.
     */
    pushItem (key, value) {
        let stored;
        stored = this.getItem(key);
        // In case there is a previously stored item here that is not
        // parseable JSON, don't fail
        try {
            stored = JSON.parse(stored);
            stored.arr = stored.arr || [];
        }
        catch (e) {
            stored = { arr: [] };
        }
        stored.arr.push(value);
        this.setItem(key, JSON.stringify(stored));
    },

    /**
     *  getItem()
     *  Retrieves value for the given key name and application namespace.
     */
    getItem (key) {
        if (window.localStorage) {
            return window.localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
        }
    },

    /**
     *  removeItem()
     *  Removes key-value pair under the application namespace.
     */
    removeItem (key) {
        if (window.localStorage) {
            window.localStorage.removeItem(LOCAL_STORAGE_PREFIX + key);
        }
    },

    /**
     *  clear()
     *  Loops through all values in localStorage under the application
     *  namespace and removes them, preserving other key-value pairs in
     *  localStorage.
     */
    clear () {
        if (window.localStorage) {
            for (let key in window.localStorage) {
                if (key.indexOf(LOCAL_STORAGE_PREFIX) === 0) {
                    window.localStorage.removeItem(LOCAL_STORAGE_PREFIX + key);
                }
            }
        }
    },
};

export default LocalStorage;
