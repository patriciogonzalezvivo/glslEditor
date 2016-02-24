'use strict';

import { subscribeWindow } from 'app/ui/window';

export default class Shader {
    constructor (main) {
        this.options = main.options;
        this.container = main.container;

        // CREATE AND START GLSLCANVAS
        this.canvasDOM = document.createElement('canvas');
        this.canvasDOM.setAttribute('class', 'ge_canvas');

        this.canvasDOM.setAttribute('width', this.options.canvas_width || this.options.canvas_size || '384');
        this.canvasDOM.setAttribute('height', this.options.canvas_height || this.options.canvas_size || '384');

        this.canvasDOM.setAttribute('animate', 'true');
        this.canvasDOM.setAttribute('data-fragment', this.options.frag);

        if (this.options.imgs.length > 0) {
            let textureList = '';
            for (let i in this.options.imgs) {
                textureList += this.options.imgs[i];
                textureList += (i < this.options.imgs.length - 1) ? ',' : '';
            }
            this.canvasDOM.setAttribute('data-textures', textureList);
            this.canvasDOM.log('data-textures: ' + textureList);
        }
        this.container.appendChild(this.canvasDOM);

        this.canvas = new GlslCanvas(this.canvasDOM, { premultipliedAlpha: false, preserveDrawingBuffer: true, backgroundColor: 'rgba(1,1,1,1)' });

        subscribeWindow(this.canvasDOM, (args) => {
            if (args.state === 'snapped' || args.state === 'resized') {
                let realToCSSPixels = window.devicePixelRatio || 1;

                // Lookup the size the browser is displaying the canvas in CSS pixels
                // and compute a size needed to make our drawingbuffer match it in
                // device pixels.
                let displayWidth = Math.floor(this.canvas.gl.canvas.clientWidth * realToCSSPixels);
                let displayHeight = Math.floor(this.canvas.gl.canvas.clientHeight * realToCSSPixels);

                console.log(displayWidth, displayHeight);

                // Check if the canvas is not the same size.
                if (this.canvas.gl.canvas.width !== displayWidth ||
                    this.canvas.gl.canvas.height !== displayHeight) {
                    // Make the canvas the same size
                    this.canvas.gl.canvas.width = displayWidth;
                    this.canvas.gl.canvas.height = displayHeight;
                    // Set the viewport to match
                    this.canvas.gl.viewport(0, 0, this.canvas.gl.canvas.width, this.canvas.gl.canvas.height);
                }
            }
        });
    }
}
