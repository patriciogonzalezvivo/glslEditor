import { subscribeInteractiveDom } from 'app/tools/interactiveDom';

export default class Shader {
    constructor (main) {
        this.options = main.options;
        this.container = main.container;

        // CREATE AND START GLSLCANVAS
        this.canvasDOM = document.createElement('canvas');
        this.canvasDOM.setAttribute('class', 'ge_canvas');

        this.canvasDOM.setAttribute('width', this.options.canvas_width || this.options.canvas_size || '250');
        this.canvasDOM.setAttribute('height', this.options.canvas_height || this.options.canvas_size || '250');

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

        if (main.options.canvas_draggable) {
            subscribeInteractiveDom(this.canvasDOM, { move: false, resize: true, snap: false });
            this.canvasDOM.on('resize', (args) => {
                main.shader.canvas.onResize();
            });
        }
    }
}
