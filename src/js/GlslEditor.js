// Import CodeMirror
import CodeMirror from 'codemirror';

// Import CodeMirror addons and modules
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/search';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/wrap/hardwrap';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/indent-fold';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/javascript-hint';
import 'codemirror/addon/display/rulers';
import 'codemirror/addon/display/panel';
import 'codemirror/mode/clike/clike.js';

// Keymap
import 'codemirror/keymap/sublime';

// Import Utils
import xhr from 'xhr';
import { parseQuery, subscribeMixin } from 'app/common';

const query = parseQuery(window.location.search.slice(1));

class GlslEditor {
    constructor (selector, options) {
        subscribeMixin(this);

        this.container = document.querySelector('#glsl_editor');//selector);
        this.options = options;

        if (this.options.imgs === undefined) {
            this.options.imgs = [];
        }

        if (this.options.frag === undefined) {
            this.chechHash();
        } 

        // CREATE AND START GLSLCANVAS
        this.canvasDOM = document.createElement("canvas");
        this.canvasDOM.setAttribute('class', 'ge_canvas');
        this.canvasDOM.setAttribute('width', '384');
        this.canvasDOM.setAttribute('height', '384');
        this.canvasDOM.setAttribute('animate', 'true');
        this.canvasDOM.setAttribute("data-fragment", this.options.frag);
        if(this.options.imgs.length > 0){
            let textureList = "";
            for(i in this.options.imgs){
                textureList += this.options.imgs[i];
                textureList += (i < this.options.imgs.length-1)?",":"";
            }
            this.canvasDOM.setAttribute("data-textures",textureList);
            this.canvasDOM.log("data-textures: " + textureList);
        }
        this.container.appendChild(this.canvasDOM);
        let canvas = new GlslCanvas(this.canvasDOM);
        this.canvas = canvas;

        let mouse = {x: 0, y: 0};
        document.addEventListener('mousemove', (e) => { 
            mouse.x = e.clientX || e.pageX; 
            mouse.y = e.clientY || e.pageY 
        }, false);

        function RenderLoop() {
            canvas.setMouse(mouse);
            canvas.render();
            window.requestAnimationFrame(RenderLoop);
        }

        RenderLoop();

        // CREATE AND START CODEMIRROR
        this.editorDOM = document.createElement("div");
        this.editorDOM.setAttribute('class', 'ge_editor');
        this.container.appendChild(this.editorDOM);
        this.editor = CodeMirror(this.editorDOM, {
            value: this.options.frag,
            lineNumbers: true,
            matchBrackets: true,
            mode: "x-shader/x-fragment",
            keyMap: "sublime",
            autoCloseBrackets: true,
            extraKeys: {"Ctrl-Space": "autocomplete"},
            showCursorWhenSelecting: true,
            theme: "monokai",
            indentUnit: 4
        });

        this.editor.on("change", () => {
            this.canvas.load(this.editor.getValue());
        });
    }

    chechHash() {
        if (window.location.hash === "" ) {
            this.options.frag = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

void main(){
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;

    vec3 color = vec3(st.x,st.y,abs(sin(u_time)));

    gl_FragColor = vec4(color,1.0);
}`;
        } else {
            let hashes = location.hash.split('&');
            for (i in hashes) {
                let ext = hashes[i].substr(hashes[i].lastIndexOf('.') + 1);
                let name = hashes[i];

                // Extract hash if is present
                if (name.search("#") === 0) {
                    name = name.substr(1);
                }

                if (ext == "frag") {
                    this.options.frag = fetchHTTP(name);
                } else if (ext == "png" || ext == "jpg" || ext == "PNG" || ext == "JPG" ){
                    this.options.imgs.push(hashes[i]);
                }
            }
        }
    }
}

window.GlslEditor = GlslEditor;
