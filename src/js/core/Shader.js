import GlslCanvas from 'glslCanvas';
import { subscribeInteractiveDom } from '../tools/interactiveDom';

export default class Shader {
    constructor (main) {
        this.options = main.options;
        this.container = main.container;

        // CREATE AND START GLSLCANVAS
        this.el = document.createElement('canvas');
        this.el.setAttribute('class', 'ge_canvas');

        this.el.setAttribute('width', this.options.canvas_width || this.options.canvas_size || '250');
        this.el.setAttribute('height', this.options.canvas_height || this.options.canvas_size || '250');

        this.el.setAttribute('data-fragment', this.options.frag);

        this.container.appendChild(this.el);
        this.canvas = new GlslCanvas(this.el, { premultipliedAlpha: false, preserveDrawingBuffer: true, backgroundColor: 'rgba(1,1,1,1)' });
        
        
        if (this.options.imgs.length > 0) {
            for (let i in this.options.imgs) {
                this.canvas.setUniform('u_tex' + i, this.options.imgs[i]);
            }
        }


        if (main.options.canvas_draggable || main.options.canvas_resizable || main.options.canvas_snapable) {
            subscribeInteractiveDom(this.el, { 
                                                move: main.options.canvas_draggable,
                                                resize: main.options.canvas_resizable,
                                                snap: main.options.canvas_snapable 
                                            });

            if (main.options.canvas_size === 'halfscreen') {
                this.el.snapRight();
            }
        }

        // If there is a menu offset the editor to come after it
        if (main.menu) {
            this.el.style.top = (main.menu.el.clientHeight || main.menu.el.offsetHeight || main.menu.el.scrollHeight) + "px";
        }
    }
}
