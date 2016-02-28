
import Shader from 'app/core/Shader';
import { initEditor } from 'app/core/Editor';

import Menu from 'app/ui/Menu';
import Helpers from 'app/ui/Helpers';
import ErrorsDisplay from 'app/ui/ErrorsDisplay';
import VisualDebugger from 'app/ui/VisualDebugger';

import FileDrop from 'app/io/FileDrop';
import HashWatch from 'app/io/HashWatch';
import BufferManager from 'app/io/BufferManager';

// Import Utils
import xhr from 'xhr';
import { subscribeMixin } from 'app/tools/mixin';

// 3er Parties
import { saveAs } from 'app/vendor/FileSaver.min.js';
// import GIF from 'app/vendor/gif.js'

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

    st += vec2(.0);
    vec3 color = vec3(1.);
    color = vec3(st.x,st.y,abs(sin(u_time)));

    gl_FragColor = vec4(color,1.0);
}`;

class GlslEditor {
    constructor (selector, options) {
        subscribeMixin(this);

        if (typeof selector === 'object' && selector.nodeType && selector.nodeType === 1) {
            this.container = selector;
        }
        else if (typeof selector === 'string') {
            this.container = document.querySelector(selector);
        }
        else {
            console.log('Error, type ' + typeof selector + ' of ' + selector + ' is unknown');
            return;
        }

        this.options = {};

        if (options) {
            this.options = options;
        }

        if (!this.options.imgs) {
            this.options.imgs = [];
        }

        // Default Theme
        if (!this.options.theme) {
            this.options.theme = 'default';
        }

        // Default Context
        if (!this.options.frag) {
            this.options.frag = EMPTY_FRAG_SHADER;
        }

        // Default invisible Fragment header
        if (!this.options.frag_header) {
            this.options.frag_header = '';
        }

        // Default invisible Fragment footer
        if (!this.options.frag_footer) {
            this.options.frag_footer = '';
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

        // Support for multiple buffers
        if (this.options.multipleBuffers) {
            this.bufferManager = new BufferManager(this);
        }

        // CORE elements
        this.shader = new Shader(this);
        this.editor = initEditor(this);

        this.helpers = new Helpers(this);
        this.errorsDisplay = new ErrorsDisplay(this);
        this.visualDebugger = new VisualDebugger(this);

        // EVENTS
        this.editor.on('change', () => {
            this.shader.canvas.load( this.options.frag_header + this.editor.getValue() + this.options.frag_footer);
        });

        if (this.options.canvas_follow) {
            this.shader.canvasDOM.style.position = 'relative';
            this.shader.canvasDOM.style.float = 'right';
            this.editor.on('cursorActivity', (cm) => {
                let height = cm.heightAtLine(cm.getCursor().line + 1, 'local') - this.shader.canvasDOM.height;
                if (height < 0) {
                    height = 0.0;
                }
                this.shader.canvasDOM.style.top = height.toString() + 'px';
            });
        }

        return this;
    }

    new () {
        this.setContent(EMPTY_FRAG_SHADER, (new Date().getTime()).toString() + '.frag');
        this.trigger('new_content', {});
    }

    setContent(shader, tabName) {
        // If the string is CODE
        this.options.frag = shader;
        if (this.shader && this.shader.canvas) {
            this.shader.canvas.load(shader);
        }

        if (this.editor) {
            if (tabName !== undefined && this.bufferManager !== undefined) {
                this.bufferManager.open(tabName, shader);
                this.bufferManager.select(tabName);
            }
            else {
                this.editor.setValue(shader);
                this.editor.setSize(null, this.editor.getDoc().height + 'px');
                this.editor.setSize(null, 'auto');
            }
        }
    }

    open (shader, tabName) {
        if (typeof shader === 'object') {
            const reader = new FileReader();
            let ge = this;
            reader.onload = (e) => {
                ge.setContent(e.target.result, shader.name);
            };
            reader.readAsText(shader);
        }
        else if (typeof shader === 'string') {
            if (/\.frag$/.test(shader) || /\.fs$/.test(shader)) {
                // If the string is an URL
                xhr.get(shader, (error, response, body) => {
                    if (error) {
                        console.log('Error downloading ', shader, error);
                        return;
                    }
                    this.setContent(body, tabName);
                });
            }
            else {
                this.setContent(shader, tabName);
            }
        }
    }

    getContent() {
        return this.editor.getValue();
    }

    getAuthor() {
        let content = this.getContent();
        let result = content.match(/\/\/\s*[A|a]uthor\s*:\s*([\w|\s|\@|\(|\)|\-|\_]*)/i);
        if (result && !(result[1] === ' ' || result[1] === '')) {
            let author = result[1].replace(/(\r\n|\n|\r)/gm,'');
            return author;
        }
        else {
            return 'unknown';
        }
    }

    getTitle() {
        let content = this.getContent();
        let result = content.match(/\/\/\s*[T|t]itle\s*:\s*([\w|\s|\@|\(|\)|\-|\_]*)/i);
        if (result && !(result[1] === ' ' || result[1] === '')) {
            let title = result[1].replace(/(\r\n|\n|\r)/gm,'');
            return title;
        }
        else {
            return 'unknown';
        }
    }

    download () {
        let content = this.getContent();
        let name = this.getTitle();
        if (name !== '') {
            name += '-';
        }
        name += new Date().getTime();

        // Download code
        const blob = new Blob([content], { type: 'text/plain' });
        saveAs(blob, name + '.frag');
        this.editor.doc.markClean();
    }

    makeGif (settings) {
        settings = settings || {};
        settings.quality = 31 - ((settings.quality * 30 / 100) || 10);
        settings.workers = settings.workers || 4;
        settings.totalFrames = settings.totalFrames || 100;
        settings.workersPath = settings.workersPath || './';

        let gif = new GIF({
            workers: settings.workers,
            quality: settings.quality,
            width: this.shader.canvasDOM.width,
            height: this.shader.canvasDOM.height,
            workerScript: settings.workersPath + 'gif.worker.js'
        });

        let totalFrames = 0;
        this.shader.canvas.on('render', () => {
            if (totalFrames < settings.totalFrames) {
                console.log('adding frame', totalFrames, '/', settings.totalFrames);
                gif.addFrame(this.shader.canvasDOM);
            }
            else if (totalFrames === settings.totalFrames) {
                gif.render();
                this.shader.canvas.off('render');
            }
            totalFrames++;
        });

        gif.on('progress', (progress) => {
            console.log('Progress', progress);
        });

        gif.on('finished', (blob) => {
            console.log('Finished', URL.createObjectURL(blob));
            window.open(URL.createObjectURL(blob));
        });
    }
}

window.GlslEditor = GlslEditor;
