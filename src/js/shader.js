'use strict';

export default class Shader {
    constructor (container, options) {
        // CREATE AND START GLSLCANVAS
        this.canvasDOM = document.createElement('canvas');
        this.canvasDOM.setAttribute('class', 'ge_canvas');
        this.canvasDOM.setAttribute('width', '384');
        this.canvasDOM.setAttribute('height', '384');
        this.canvasDOM.setAttribute('animate', 'true');
        // this.canvasDOM.setAttribute('data-fragment', options.frag);
        if (options.imgs.length > 0) {
            let textureList = '';
            for (let i in options.imgs) {
                textureList += options.imgs[i];
                textureList += (i < options.imgs.length - 1) ? ',' : '';
            }
            this.canvasDOM.setAttribute('data-textures', textureList);
            this.canvasDOM.log('data-textures: ' + textureList);
        }
        container.appendChild(this.canvasDOM);
        
        this.canvas = new GlslCanvas(this.canvasDOM);
    }
}