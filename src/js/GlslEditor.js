
import Shader from 'app/core/Shader';
import { initEditor } from 'app/core/Editor';

import Menu from 'app/ui/Menu';
import Divider from 'app/ui/Divider';

import FileDrop from 'app/io/FileDrop';
import HashWatch from 'app/io/HashWatch';
import BufferManager from 'app/io/BufferManager';


// Import Utils
import xhr from 'xhr';
import { subscribeMixin } from 'app/tools/mixin';
import { saveAs } from 'app/vendor/FileSaver.min.js';

const EMPTY_FRAG_SHADER = `// Author: 
// Title: 

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;

    vec3 color = vec3(st.x,st.y,abs(sin(u_time)));

    gl_FragColor = vec4(color,1.0);
}`;

class GlslEditor {
    constructor (selector, options) {
        subscribeMixin(this);

        this.container = document.querySelector(selector);
        this.options = {};

        if (options) {
            this.options = options;
        }

        if (this.options.theme === undefined) {
            this.options.theme = 'monokai';
        }

        if (this.options.imgs === undefined) {
            this.options.imgs = [];
        }

        if (this.options.frag === undefined) {
            this.options.frag = EMPTY_FRAG_SHADER;
        }

        // Load UI
        if (this.options.menu) {
            this.menu = new Menu(this);
        }

        // Listen to hash changes
        if (this.options.watchHash) {
            new HashWatch(this);
        }

        // Listen to file drops
        if (this.options.fileDrops) {
            new FileDrop(this);
        }

        if (this.options.multipleBuffers) {
            this.bufferManager = new BufferManager(this);
        }
        
        // CORE elements
        this.sandbox = new Shader(this);
        this.editor = initEditor(this);
        
        if (this.options.divider) {
            this.divider = new Divider(this);
        }

        // EVENTS
        this.editor.on('change', () => {
            this.sandbox.canvas.load(this.editor.getValue());
        });

        this.editor.on("cursorActivity", (cm) => {
            if (this.options.canvas_follow) {
                var height = cm.heightAtLine(cm.getCursor().line+1,'local') - this.sandbox.canvasDOM.height;
                if (height < 0) {
                    height = 0.0;   
                }
                this.sandbox.canvasDOM.style.top = (height).toString()+"px";
            }
        });

        this.editor.on('viewportChange', () => {
            console.log(new Date().getTime());
        });
    }

    new () {
        this.load(EMPTY_FRAG_SHADER);
    }

    setContent (shader, newBuffer) {
        // If the string is CODE
        this.options.frag = shader;
        if (this.sandbox && this.sandbox.canvas) {
            this.sandbox.canvas.load(shader);
        }

        if (this.editor) {
            if (newBuffer && this.bufferManager !== undefined) {
                let name = (new Date().getTime()).toString();
                this.bufferManager.new(name, shader);
                this.bufferManager.select(name);
            } else {
                this.editor.setValue(shader);
            }
        }
    }

    open (shader) {
        if (typeof shader === 'object') {
            const reader = new FileReader();
            let ge = this;
            reader.onload = (e) => {
                console.log(e);
                ge.setContent(e.target.result, true);
            };
            reader.readAsText(shader);
        } else if (typeof shader === 'string') {
            if (/\.frag$/.test(shader) || /\.fs$/.test(shader)) {
                // If the string is an URL
                xhr.get(shader, (error, response, body) => {
                    if (error) {
                        console.log('Error downloading ', shader, error);
                        return;
                    }
                    this.setContent(body);
                });
            } else {
               this.setContent(shader);
            }
        }
    }

    getContent() {
        return this.editor.getValue();
    }

    getAuthor() {
        let content = this.getContent();
        let result = content.match( /\/\/\s*[A|a]uthor:\s*(\w+)/i );
        if (result) {
            return result[1];
        }
        else {
            return '';
        }
    }

    getTitle() {
        let content = this.getContent();
        let result = content.match( /\/\/\s*[T|t]itle:\s*(\w+)/i );
        if (result) {
            return result[1];
        }
        else {
            return '';
        }
    }

    download () {
        let content = this.getContent();
        let name = this.getTitle();
        if (name !== '' ) {
            name += '-'; 
        }
        name += new Date().getTime();

        // Download code
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, name+'.frag');
        this.editor.doc.markClean();
    }
}

window.GlslEditor = GlslEditor;
