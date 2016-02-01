'use strict';

import Color from 'app/tools/Color';

// Some common use variables
let startPoint;
let currentTarget;
let currentTargetHeight = 0;
let domCache;

// Default modal appearance values
const MODAL_WIDTH = 260; // in pixels
const MODAL_HEIGHT = 270; // in pixels
const MODAL_VIEWPORT_EDGE_BUFFER = 20; // buffer zone at the viewport edge where a modal should not be presented

export default class ColorPickerModal {
    constructor (color = 'vec3(1.0,0.0,0.0)') {
        this.value = new Color(color);

        this.listeners = {};
        this.dom = {};
        this.el = this.createDom();

        // TODO: Improve these references
        // The caching of references is likely to be important for speed
        this.dom.hsvMap = this.el.querySelector('.colorpicker-hsv-map');
        this.dom.hsvMapCover = this.dom.hsvMap.children[1]; // well...
        this.dom.hsvMapCursor = this.dom.hsvMap.children[2];
        this.dom.hsvBarBGLayer = this.dom.hsvMap.children[3];
        this.dom.hsvBarWhiteLayer = this.dom.hsvMap.children[4];
        this.dom.hsvBarCursors = this.dom.hsvMap.children[6];
        this.dom.hsvLeftCursor = this.dom.hsvBarCursors.children[0];
        this.dom.hsvRightCursor = this.dom.hsvBarCursors.children[1];

        this.dom.colorDisc = this.el.querySelector('.colorpicker-disc');
        this.dom.luminanceBar = this.el.querySelector('.colorpicker-bar-luminance');

        this.initRenderer();
        this.isVisible = false;
    }

    createDom () {
        if (!domCache) {
            let modal = document.createElement('div');
            let patch = document.createElement('div');
            let map = document.createElement('div');
            let disc = document.createElement('canvas');
            let cover = document.createElement('div');
            let cursor = document.createElement('div');
            let barbg = document.createElement('div');
            let barwhite = document.createElement('div');
            let barlum = document.createElement('canvas');
            let barcursors = document.createElement('div');
            let leftcursor = document.createElement('div');
            let rightcursor = document.createElement('div');

            const CSS_PREFIX = 'colorpicker' + '-';

            modal.className = CSS_PREFIX + 'modal';
            patch.className = CSS_PREFIX + 'patch';
            map.className = CSS_PREFIX + 'hsv-map';
            disc.className = CSS_PREFIX + 'disc';
            cover.className = CSS_PREFIX + 'disc-cover';
            cursor.className = CSS_PREFIX + 'disc-cursor';
            barbg.className = CSS_PREFIX + 'bar-bg';
            barwhite.className = CSS_PREFIX + 'bar-white';
            barlum.className = CSS_PREFIX + 'bar-luminance';
            barcursors.className = CSS_PREFIX + 'bar-cursors';
            leftcursor.className = CSS_PREFIX + 'bar-cursor-left';
            rightcursor.className = CSS_PREFIX + 'bar-cursor-right';

            disc.width = 200;
            disc.height = 200;
            barlum.width = 25;
            barlum.height = 200;
            map.id = 'cp-map';
            barcursors.id = 'cp-bar';

            modal.appendChild(patch);
            modal.appendChild(map);
            map.appendChild(disc);
            map.appendChild(cover);
            map.appendChild(cursor);
            map.appendChild(barbg);
            map.appendChild(barwhite);
            map.appendChild(barlum);
            map.appendChild(barcursors);
            barcursors.appendChild(leftcursor);
            barcursors.appendChild(rightcursor);

            domCache = modal;
        }

        // Returns a clone of the cached document fragment
        return domCache.cloneNode(true);
    }

    showAt(cm) {
        // Turn the picker on and present modal at the desired position
        let topOffset = 22;
        let topBoundary = 250;
        let bottomOffset = 16;
        let leftOffset = -65;
        let cursorOffset = cm.cursorCoords(true, "page");
        let leftBase = cm.cursorCoords(true, "page").left;
        let pickerTop = (cursorOffset.top + topOffset);
        if (cursorOffset.top < topBoundary) {
            pickerTop = (cursorOffset.top + bottomOffset)
        }
        let pickerLeft = leftBase + leftOffset;
        this.presentModal(pickerLeft, pickerTop);
    }

    presentModal (x, y) {
        // Check if desired x, y will be outside the viewport.
        // Do not allow the modal to disappear off the edge of the window.
        let modalXPos = (x + MODAL_WIDTH < window.innerWidth) ? x : (window.innerWidth - MODAL_VIEWPORT_EDGE_BUFFER - MODAL_WIDTH);
        let modalYPos = (y + MODAL_HEIGHT < window.innerHeight) ? y : (window.innerHeight - MODAL_VIEWPORT_EDGE_BUFFER - MODAL_HEIGHT);

        this.el.style.left = modalXPos + 'px';
        this.el.style.top = modalYPos + 'px';
        document.body.appendChild(this.el);

        // Listen for interaction on the HSV map
        this.hsvDownHandler = Tools.addEvent(this.dom.hsvMap, 'mousedown', this.hsvDown, this);

        // Listen for interaction outside of the modal
        window.setTimeout(() => {
            this.onClickOutsideHandler = Tools.addEvent(document.body, 'click', this.onClickOutside, this);
        }, 0);

        let colorDisc = this.dom.colorDisc;

        if (colorDisc.getContext) {
            // HSV color wheel with white center
            drawDisk(
                colorDisc.getContext('2d'),
                [colorDisc.width / 2, colorDisc.height / 2],
                [colorDisc.width / 2 - 1, colorDisc.height / 2 - 1],
                360,
                function (ctx, angle) {
                    let gradient = ctx.createRadialGradient(1, 1, 1, 1, 1, 0);
                    gradient.addColorStop(0, 'hsl(' + (360 - angle + 0) + ', 100%, 50%)');
                    gradient.addColorStop(1, '#fff');

                    ctx.fillStyle = gradient;
                    ctx.fill();
                }
            );
            // gray border
            drawCircle(
                colorDisc.getContext('2d'),
                [colorDisc.width / 2, colorDisc.height / 2],
                [colorDisc.width / 2, colorDisc.height / 2],
                '#303030',
                2
            );

            // draw the luminanceBar bar
            let ctx = this.dom.luminanceBar.getContext('2d');
            let gradient = ctx.createLinearGradient(0, 0, 0, 200);

            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(1, 'black');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 30, 200);
        }

        this.isVisible = true;
        this.renderer.tick();
    }

    /**
     *  This initializes the renderer. It uses requestAnimationFrame() to
     *  smoothly render changes in the color picker as user interacts with it.
     */
    initRenderer () {
        this.renderer = {
            // Stores a reference to the animation rendering loop.
            frame: null,

            // Animates one frame of activity. Call this directly if you do not
            // need it to go into the animation rendering loop.
            tick: () => {
                this.renderTestPatch();
                this.renderHSVPicker();
            },

            // Starts animation rendering loop
            start: () => {
                this.renderer.tick();
                this.renderer.frame = window.requestAnimationFrame(this.renderer.start);
            },

            // Stops animation rendering loop
            stop: () => {
                window.cancelAnimationFrame(this.renderer.frame);
            }
        };
    }

    /**
     *  Updates only the color value of the color picker
     *  and the view. Designed to be called by external modules
     *  so that it can update its internal value from an outside source.
     *  Does no DOM creation & other initialization work.
     */
    setColor (color) {
        // Set color
        this.color = color;
        this.value = new Color(this.color);

        if (this.renderer) {
            // Update render by one tick
            this.renderer.tick();
        }
    }

    getColor () {
        return this.color;
    }

    /* ---------------------------------- */
    /* ---- HSV-circle color picker ----- */
    /* ---------------------------------- */

    // Actions when user mouses down on HSV color map
    hsvDown (event) {
        let target = event.target || event.srcElement;

        event.preventDefault();

        currentTarget = target.id ? target : target.parentNode;
        startPoint = Tools.getOrigin(currentTarget);
        currentTargetHeight = currentTarget.offsetHeight; // as diameter of circle

        // Starts listening for mousemove and mouseup events
        this.hsvMoveHandler = Tools.addEvent(window, 'mousemove', this.hsvMove, this);
        this.hsvUpHandler = Tools.addEvent(window, 'mouseup', this.hsvUp, this);

        this.hsvMove(event);

        // Hides mouse cursor and begins rendering loop
        this.dom.hsvMap.classList.add('colorpicker-no-cursor');
        this.renderer.start();
    }

    // Actions when user moves around on HSV color map
    hsvMove (event) {
        let r, x, y, h, s;
        if (currentTarget === this.dom.hsvMap) { // the circle
            r = currentTargetHeight / 2,
            x = event.clientX - startPoint.left - r,
            y = event.clientY - startPoint.top - r,
            h = (360 - ((Math.atan2(y, x) * 180 / Math.PI) + (y < 0 ? 360 : 0)))/360,
            s = (Math.sqrt((x * x) + (y * y)) / r);
            this.value.set({ h, s }, 'hsv');
        }
        else if (currentTarget === this.dom.hsvBarCursors) { // the luminanceBar
            let v = (currentTargetHeight - (event.clientY - startPoint.top)) / currentTargetHeight;
            v = Math.max(0, Math.min(1, v))*255;
            this.value.set({ v: v }, 'hsv');
        }

        // fire 'changed'
        if (this.listeners.changed && typeof this.listeners.changed === 'function') {
            this.listeners.changed(this.value);
        }
    }

    // Actions when user mouses up on HSV color map
    hsvUp (event) {
        // Stops rendering and returns mouse cursor
        this.renderer.stop();
        this.dom.hsvMap.classList.remove('colorpicker-no-cursor');
        this.destroyEvents();
    }

    onClickOutside (event) {
        // HACKY!!
        // A click event fires on the body after mousedown - mousemove, simultaneously with
        // mouseup. So if someone started a mouse action inside the color picker modal and then
        // mouseup'd outside of it, it fires a click event on the body, thus, causing the
        // modal to disappear when the user does not expect it to, since the mouse down event
        // did not start outside the modal.
        // There might be (or should be) a better way to track this, but right now, just cancel
        // the event if the target ends up being on the body directly rather than on one of the
        // other child elements.
        if (event.target === document.body) {
            return;
        }
        // end this specific hacky part

        let target = event.target;

        while (target !== document.documentElement && !target.classList.contains('colorpicker-modal')) {
            target = target.parentNode;
        }

        if (!target.classList.contains('colorpicker-modal')) {
            this.removeModal();
        }
    }

    /**
     *  Removes modal from DOM and destroys related event listeners
     */
    removeModal () {
        if (this.el && this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
        this.destroyEvents();

        // Destroy event listeners that should not exist when modal is gone
        Tools.removeEvent(this.dom.hsvMap, 'mousedown', this.hsvDownHandler);
        this.hsvDownHandler = null;
        Tools.removeEvent(document.body, 'click', this.onClickOutsideHandler);
        this.onClickOutsideHandler = null;

        this.isVisible = false;
    }

    // Destroy event listeners that exist during mousedown colorpicker interaction
    destroyEvents () {
        Tools.removeEvent(window, 'mousemove', this.hsvMoveHandler);
        Tools.removeEvent(window, 'mouseup', this.hsvUpHandler);
        this.hsvMoveHandler = null;
        this.hsvUpHandler = null;
    }

    /**
     *  Render color patch
     */
    renderTestPatch () {
        let patch = this.el.querySelector('.colorpicker-patch');
        let color = this.value.getString('rgb');
        patch.style.backgroundColor = color;
    }

    /**
     *  Render HSV picker
     */
    renderHSVPicker () {
        let color = this.value.colors;
        let colorDiscRadius = this.dom.colorDisc.offsetHeight / 2;
        let pi2 = Math.PI * 2;
        let x = Math.cos(pi2 - color.hsv.h * pi2);
        let y = Math.sin(pi2 - color.hsv.h * pi2);
        let r = color.hsv.s * (colorDiscRadius - 5);

        this.dom.hsvMapCover.style.opacity = 1 - color.hsv.v/255;
        // this is the faster version...
        this.dom.hsvBarWhiteLayer.style.opacity = 1 - color.hsv.s;
        this.dom.hsvBarBGLayer.style.backgroundColor = 'rgb(' +
            color.hueRGB.r + ',' +
            color.hueRGB.g + ',' +
            color.hueRGB.b + ')';

        this.dom.hsvMapCursor.style.cssText =
            'left: ' + (x * r + colorDiscRadius) + 'px;' +
            'top: ' + (y * r + colorDiscRadius) + 'px;' +
            'border-color: ' + (color.luminance > 0.22 ? '#333;' : '#ddd');

        if (color.luminance > 0.22) {
            this.dom.hsvBarCursors.classList.add('colorpicker-dark');
        }
        else {
            this.dom.hsvBarCursors.classList.remove('colorpicker-dark');
        }

        if (this.dom.hsvLeftCursor) {
            this.dom.hsvLeftCursor.style.top = this.dom.hsvRightCursor.style.top = ((1 - color.hsv.v/255) * colorDiscRadius * 2) + 'px';
        }
    }

    // Monkey patches for Thistle.js functionality

    /**
     *  Execute a callback for a fired event listener
     */
    on (type, callback) {
        this.listeners[type] = callback;
    }
}

// generic function for drawing a canvas disc
function drawDisk (ctx, coords, radius, steps, colorCallback) {
    let x = coords[0] || coords; // coordinate on x-axis
    let y = coords[1] || coords; // coordinate on y-axis
    let a = radius[0] || radius; // radius on x-axis
    let b = radius[1] || radius; // radius on y-axis
    let angle = 360;
    let coef = Math.PI / 180;

    ctx.save();
    ctx.translate(x - a, y - b);
    ctx.scale(a, b);

    steps = (angle / steps) || 360;

    for (; angle > 0 ; angle -= steps) {
        ctx.beginPath();
        if (steps !== 360) {
            ctx.moveTo(1, 1); // stroke
        }
        ctx.arc(1, 1, 1,
            (angle - (steps / 2) - 1) * coef,
            (angle + (steps / 2) + 1) * coef);

        if (colorCallback) {
            colorCallback(ctx, angle);
        }
        else {
            ctx.fillStyle = 'black';
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawCircle (ctx, coords, radius, color, width) { // uses drawDisk
    width = width || 1;
    radius = [
        (radius[0] || radius) - width / 2,
        (radius[1] || radius) - width / 2
    ];
    drawDisk(ctx, coords, radius, 1, function (ctx, angle) {
        ctx.restore();
        ctx.lineWidth = width;
        ctx.strokeStyle = color || '#000';
        ctx.stroke();
    });
}

const Tools = {
    getOrigin (el) {
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
    },
    eventCache: null,
    addEvent (element, event, callback, caller) {
        var handler;
        element.addEventListener(event, handler = function (e) {
            callback.call(caller, e);
        }, false);
        return handler;
    },
    removeEvent (element, event, callback) {
        element.removeEventListener(event, callback, false);
    }
};

