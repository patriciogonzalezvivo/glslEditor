/*
Original: https://github.com/tangrams/tangram-play/blob/gh-pages/src/js/addons/ui/widgets/ColorPickerModal.js
Author: Lou Huang (@saikofish)
*/

import Picker from './Picker';
import Color from './types/Color';
import { addEvent, removeEvent } from './Picker';
import { getDevicePixelRatio } from '../../tools/common';

import { subscribeInteractiveDom } from '../../tools/interactiveDom';

// Some common use variables
let currentTarget;
let currentTargetHeight = 0;
let domCache;

export default class ColorPicker extends Picker {
    constructor (color = 'vec3(1.0,0.0,0.0)', properties = {}) {
        super('ge_colorpicker_', properties);

        this.width = 250; // in pixels
        this.height = 250; // in pixels

        this.disc = { width: 200, height: 200 };
        this.barlum = { width: 25, height: 200 };

        this.setValue(color);
        this.init();
    }

    init() {
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

            modal.className = this.CSS_PREFIX + 'modal ge_picker_modal';
            modal.style.backgroundColor = this.bgColor;
            patch.className = this.CSS_PREFIX + 'patch';
            patch.style.backgroundColor = this.bgColor;
            map.className = this.CSS_PREFIX + 'hsv-map';
            disc.className = this.CSS_PREFIX + 'disc';
            disc.style.backgroundColor = this.bgColor;
            cover.className = this.CSS_PREFIX + 'disc-cover';
            cursor.className = this.CSS_PREFIX + 'disc-cursor';
            barbg.className = this.CSS_PREFIX + 'bar-bg';
            barwhite.className = this.CSS_PREFIX + 'bar-white';
            barlum.className = this.CSS_PREFIX + 'bar-luminance';
            barcursors.className = this.CSS_PREFIX + 'bar-cursors';
            leftcursor.className = this.CSS_PREFIX + 'bar-cursor-left';
            rightcursor.className = this.CSS_PREFIX + 'bar-cursor-right';

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
        this.el = domCache.cloneNode(true);
        subscribeInteractiveDom(this.el, { move: true, resize: false, snap: false });

        // TODO: Improve these references
        // The caching of references is likely to be important for speed
        this.dom = {};
        this.dom.hsvMap = this.el.querySelector('.ge_colorpicker_hsv-map');
        this.dom.hsvMapCover = this.dom.hsvMap.children[1]; // well...
        this.dom.hsvMapCursor = this.dom.hsvMap.children[2];
        this.dom.hsvBarBGLayer = this.dom.hsvMap.children[3];
        this.dom.hsvBarWhiteLayer = this.dom.hsvMap.children[4];
        this.dom.hsvBarCursors = this.dom.hsvMap.children[6];
        this.dom.hsvLeftCursor = this.dom.hsvBarCursors.children[0];
        this.dom.hsvRightCursor = this.dom.hsvBarCursors.children[1];

        this.dom.colorDisc = this.el.querySelector('.ge_colorpicker_disc');
        this.dom.luminanceBar = this.el.querySelector('.ge_colorpicker_bar-luminance');

        if (this.linkButton) {
            let lbutton = document.createElement('div');
            lbutton.innerHTML = '+';
            lbutton.className = this.CSS_PREFIX + 'link-button';
            lbutton.style.color = this.fgColor;
            this.el.appendChild(lbutton);

            lbutton.addEventListener('click', () => {
                this.trigger('linkButton', this.value);
                if (typeof this.linkButton === 'function') {
                    this.linkButton(this.value);
                }
                this.removeModal();
            });
        }
    }

    draw () {
        //  Render color patch
        let patch = this.el.querySelector('.ge_colorpicker_patch');
        patch.style.backgroundColor = this.value.getString('rgb');

        //  Render HSV picker
        let color = this.value.colors;
        let colorDiscRadius = this.dom.colorDisc.offsetHeight / 2;
        let pi2 = Math.PI * 2;
        let x = Math.cos(pi2 - color.hsv.h * pi2);
        let y = Math.sin(pi2 - color.hsv.h * pi2);
        let r = color.hsv.s * (colorDiscRadius - 5);

        this.dom.hsvMapCover.style.opacity = 1 - color.hsv.v / 255;
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
            this.dom.hsvBarCursors.classList.add('ge_colorpicker_dark');
        }
        else {
            this.dom.hsvBarCursors.classList.remove('ge_colorpicker_dark');
        }

        if (this.dom.hsvLeftCursor) {
            this.dom.hsvLeftCursor.style.top = this.dom.hsvRightCursor.style.top = ((1 - color.hsv.v / 255) * colorDiscRadius * 2) + 'px';
        }
    }

    presentModal (x, y) {
        super.presentModal(x, y);

        // // Listen for interaction on the HSV map
        this.onHsvDownHandler = addEvent(this.dom.hsvMap, 'mousedown', this.onHsvDown, this);

        let colorDisc = this.dom.colorDisc;

        if (colorDisc.getContext) {
            // HSV color wheel with white center
            let diskContext = colorDisc.getContext('2d');
            let ratio = getDevicePixelRatio(diskContext);
            let width = this.disc.width / ratio;
            let height = this.disc.height / ratio;
            this.dom.colorDisc.width = width * ratio;
            this.dom.colorDisc.height = height * ratio;
            diskContext.scale(ratio, ratio);

            drawDisk(
                diskContext,
                [width / 2, height / 2],
                [width / 2 - 1, height / 2 - 1],
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
                diskContext,
                [width / 2, height / 2],
                [width / 2, height / 2],
                this.bgColor,// '#303030',
                2 / ratio
            );

            // draw the luminanceBar bar
            let ctx = this.dom.luminanceBar.getContext('2d');
            this.dom.luminanceBar.width = this.barlum.width;
            this.dom.luminanceBar.height = this.barlum.height * ratio;
            ctx.scale(ratio, ratio);
            let gradient = ctx.createLinearGradient(0, 0, 0, this.barlum.height / ratio);

            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(1, 'black');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 30, 200);
        }
        this.draw();
    }

    /**
     *  Updates only the color value of the color picker
     *  and the view. Designed to be called by external modules
     *  so that it can update its internal value from an outside source.
     *  Does no DOM creation & other initialization work.
     */
    setValue (color) {
        this.value = new Color(color);
    }

    /* ---------------------------------- */
    /* ---- HSV-circle color picker ----- */
    /* ---------------------------------- */

    // Actions when user mouses down on HSV color map
    onHsvDown (event) {
        let target = event.target || event.srcElement;
        event.preventDefault();

        currentTarget = target.id ? target : target.parentNode;
        currentTargetHeight = currentTarget.offsetHeight; // as diameter of circle

        // Starts listening for mousemove and mouseup events
        this.onHsvMoveHandler = addEvent(this.el, 'mousemove', this.onHsvMove, this);
        this.onHsvUpHandler = addEvent(window, 'mouseup', this.onHsvUp, this);

        this.onHsvMove(event);

        // Hides mouse cursor and begins rendering loop
        this.dom.hsvMap.classList.add('ge_colorpicker_no-cursor');
        this.renderer.start();
    }

    // Actions when user moves around on HSV color map
    onHsvMove (event) {
        event.preventDefault();
        event.stopPropagation();

        let r, x, y, h, s;
        if (event.target === this.dom.hsvMapCover && currentTarget === this.dom.hsvMap) { // the circle
            r = currentTargetHeight / 2,
            x = event.offsetX - r,
            y = event.offsetY - r,
            h = (360 - ((Math.atan2(y, x) * 180 / Math.PI) + (y < 0 ? 360 : 0))) / 360,
            s = (Math.sqrt((x * x) + (y * y)) / r);
            this.value.set({ h, s }, 'hsv');
        }
        else if (event.target === this.dom.hsvBarCursors && currentTarget === this.dom.hsvBarCursors) { // the luminanceBar
            let v = (currentTargetHeight - (event.offsetY)) / currentTargetHeight;
            v = Math.max(0, Math.min(1, v)) * 255;
            this.value.set({ v: v }, 'hsv');
        }

        this.trigger('changed', this.value);
    }

    // Actions when user mouses up on HSV color map
    onHsvUp (event) {
        // Stops rendering and returns mouse cursor
        this.renderer.stop();
        this.dom.hsvMap.classList.remove('ge_colorpicker_no-cursor');
        this.destroyEvents();
    }

    // Destroy event listeners that exist during mousedown colorpicker interaction
    destroyEvents () {
        removeEvent(this.el, 'mousemove', this.onHsvMoveHandler);
        this.onHsvMoveHandler = null;
        removeEvent(window, 'mouseup', this.onHsvUpHandler);
        this.onHsvUpHandler = null;
    }

    close () {
        this.destroyEvents();
        removeEvent(this.dom.hsvMap, 'mousedown', this.onHsvDownHandler);
        this.onHsvDownHandler = null;
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
