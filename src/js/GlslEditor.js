
import Menu from 'app/core/menu';
import Shader from 'app/core/shader';
import { initEditor } from 'app/core/editor';

// Import Utils
import xhr from 'xhr';
import { subscribeMixin } from 'app/core/common';
import { saveAs } from 'app/vendor/FileSaver.min.js';

const EMPTY_FRAG_SHADER = `// Author:
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

        if (options !== undefined) {
            this.options = options;
        }
        else {
            this.options = {};
        }

        if (this.options.imgs === undefined) {
            this.options.imgs = [];
        }

        if (this.options.frag === undefined) {
            this.options.frag = EMPTY_FRAG_SHADER;
        }

        this.chechHash();

        // INIT bin
        this.menu = new Menu(this.container, this);
        this.sandbox = new Shader(this.container, this.options);
        this.editor = initEditor(this.container, this.options);

        // EVENTS
        this.editor.on('change', () => {
            this.sandbox.canvas.load(this.editor.getValue());
        });

        // Set up some EVENTS
        window.addEventListener('hashchange', () => {
            this.chechHash();
        }, false);
    }

    chechHash() {
        if (window.location.hash !== '') {
            this.options.imgs = [];

            let hashes = location.hash.split('&');
            for (let i in hashes) {
                let ext = hashes[i].substr(hashes[i].lastIndexOf('.') + 1);
                let name = hashes[i];

                // Extract hash if is present
                if (name.search('#') === 0) {
                    name = name.substr(1);
                }

                if (ext === 'frag') {
                    xhr.get(name, (error, response, body) => {
                        if (error) {
                            console.log('Error downloading ', name, error);
                            return;
                        }
                        this.load(body);
                    });
                }
                else if (ext === 'png' || ext === 'jpg' || ext === 'PNG' || ext === 'JPG') {
                    this.options.imgs.push(hashes[i]);
                }
            }
        }
    }

    new () {
        this.load(EMPTY_FRAG_SHADER);
    }

    load (fragString) {
        this.options.frag = fragString;

        if (this.sandbox && this.sandbox.canvas) {
            this.sandbox.canvas.load(fragString);
        }
        if (this.editor) {
            this.editor.setValue(fragString);
        }
    }

    save () {
        let content = this.editor.getValue();
        let name = "shader";

        // STORE A COPY on SERVER
        let url = 'http://thebookofshaders.com:8080/';
        let data = new FormData();
        data.append('code', content);

        let dataURL = this.sandbox.canvasDOM.toDataURL("image/png");
        let blobBin = atob(dataURL.split(',')[1]);
        let array = [];
        for (let i = 0; i < blobBin.length; i++) {
            array.push(blobBin.charCodeAt(i));
        }
        let file = new Blob([new Uint8Array(array)], {type: 'image/png'});
        data.append("image", file);

        let xhr = new XMLHttpRequest();
        xhr.open('POST', url+'save', true);
        xhr.onload = function () {
            // window.location.href = ".#"+this.responseText;
            console.log("Save on " + url + this.responseText);
        };
        xhr.send(data);

        // Download code
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, name+'.frag');
        editor.doc.markClean();
    }
}

window.GlslEditor = GlslEditor;
