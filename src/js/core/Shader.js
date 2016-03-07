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

        this.canvasDOM.setAttribute('data-fragment', this.options.frag);

        this.container.appendChild(this.canvasDOM);

        this.canvas = new GlslCanvas(this.canvasDOM, { premultipliedAlpha: false, preserveDrawingBuffer: true, backgroundColor: 'rgba(1,1,1,1)' });
        if (this.options.imgs.length > 0) {
            for (let i in this.options.imgs) {
                this.canvas.setUniform('u_tex' + i, this.options.imgs[i]);
            }
        }

        if (main.options.canvas_draggable) {
            subscribeInteractiveDom(this.canvasDOM, { move: true, resize: true, snap: true });
        }
    }
}
