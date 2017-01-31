import GlslCanvas from 'glslCanvas';
import { subscribeInteractiveDom } from '../tools/interactiveDom';
import MenuItem from '../ui/MenuItem';

var CONTROLS_CLASSNAME = 'ge_control';

export default class Shader {
    constructor (main) {
        this.options = main.options;
        this.container = main.container;

        // CREATE AND START GLSLCANVAS
        this.el = document.createElement('div');
        this.el.setAttribute('class', 'ge_canvas_container');

        // this.el.setAttribute('width', this.options.canvas_width || this.options.canvas_size || '250');
        // this.el.setAttribute('height', this.options.canvas_height || this.options.canvas_size || '250');

        this.el_canvas = document.createElement('canvas');
        this.el_canvas.setAttribute('class', 'ge_canvas');

        this.el_canvas.setAttribute('width', this.options.canvas_width || this.options.canvas_size || '250');
        this.el_canvas.setAttribute('height', this.options.canvas_height || this.options.canvas_size || '250');

        this.el_canvas.setAttribute('data-fragment', this.options.frag);

        this.el.appendChild(this.el_canvas);
        this.container.appendChild(this.el);
        let glslcanvas = new GlslCanvas(this.el_canvas, { premultipliedAlpha: false, preserveDrawingBuffer: true, backgroundColor: 'rgba(1,1,1,1)' });
        this.canvas = glslcanvas;
        
        if (this.options.imgs.length > 0) {
            for (let i in this.options.imgs) {
                this.canvas.setUniform('u_tex' + i, this.options.imgs[i]);
            }
        }

        this.playPause = new MenuItem(this.el, CONTROLS_CLASSNAME, '&#9616;&nbsp;&#9612;', (event) => {
            event.stopPropagation();
            event.preventDefault();
            if (glslcanvas.paused) {
                glslcanvas.play();
                this.playPause.name = '&#9616;&nbsp;&#9612;';//'Pause';
            } else {
                glslcanvas.pause();
                this.playPause.name = '&nbsp;&#9654;&nbsp;';//'Play';
            }
        });
        this.el_control = document.getElementsByClassName(CONTROLS_CLASSNAME)[0];
        this.hideControls();
        
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

        this.el_canvas.addEventListener('mousemove', (event) => {
            if (event.offsetY>this.el_canvas.clientHeight*.66) {
                this.showControls();
            }
            else {
                this.hideControls();
            } 
        })
        this.el_control.addEventListener('mouseenter', (event) => {
            this.showControls();
        });
        this.el_control.addEventListener('mouseleave', (event) => {
            this.hideControls();
        });
        this.el.on('move', (event) => {
            event.el.style.width = event.el.clientWidth+'px';
            event.el.style.height = event.el.clientHeight+'px';
        })
        this.el.on('resize', (event) => {
            glslcanvas.canvas.style.width = event.el.clientWidth+'px';
            glslcanvas.canvas.style.height = event.el.clientHeight+'px';
            glslcanvas.resize();
        })
    }

    hideControls () {
        if (this.el_control.className === CONTROLS_CLASSNAME) {
            this.el_control.className = CONTROLS_CLASSNAME+' '+CONTROLS_CLASSNAME+'_hidden';
        }
    }

    showControls () {
        if (this.el_control.className === CONTROLS_CLASSNAME+' '+CONTROLS_CLASSNAME+'_hidden') {
            this.el_control.className = CONTROLS_CLASSNAME;
        }
    }
}
