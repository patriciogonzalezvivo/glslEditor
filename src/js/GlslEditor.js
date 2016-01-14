
import Menu from 'app/menu';
import Shader from 'app/shader';
import { initEditor } from 'app/editor';

// Import Utils
import xhr from 'xhr';
import { subscribeMixin } from 'app/common';

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
}

window.GlslEditor = GlslEditor;
