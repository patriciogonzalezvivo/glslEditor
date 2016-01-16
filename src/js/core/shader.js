'use strict';

// Import Greensock (GSAP)
import 'gsap/src/uncompressed/Tweenlite.js';
import 'gsap/src/uncompressed/plugins/CSSPlugin.js';
import Draggable from 'gsap/src/uncompressed/utils/Draggable.js';

const CM_MINIMUM_WIDTH = 160; // integer, in pixels
const SHADER_MINIMUM_WIDTH = 130; // integer, in pixels
const STORAGE_POSITION_KEY = 'divider-position-x';

export default class Shader {
    constructor (container, options) {
        this.options = options;
        this.container = container;

        if (this.options.divider) {
            this.dividerDOM = document.createElement('div');
            this.dividerDOM.setAttribute('class', 'ge-divider');
            let spanDOM = document.createElement('span');
            spanDOM.setAttribute('class', 'ge-divider-affordance');
            this.dividerDOM.appendChild(spanDOM);
            container.appendChild(this.dividerDOM);

            let transformStyle = 'translate3d(' + this.getStartingPosition() + 'px, 0px, 0px)';
            if (this.dividerDOM.style.hasOwnProperty('transform')) {
                this.dividerDOM.style.transform = transformStyle;
            }
            else if (this.dividerDOM.style.hasOwnProperty('webkitTransform')) {
                // For Safari
                this.dividerDOM.style.webkitTransform = transformStyle;
            }
            else {
                // For Firefox
                this.dividerDOM.style.transform = transformStyle;
            }

            let divider = this;
            // Override starting position
            this.dividerDOM.style.left = 'auto';
            this.draggable = Draggable.create(this.dividerDOM, {
                type: 'x',
                bounds: getBounds(divider.container),
                cursor: 'col-resize',
                zIndexBoost: false,
                onPress: function () {
                    this.target.classList.add('ge-divider-is-dragging');
                },
                onDrag: function () {
                    divider.reflow();
                },
                onDragEnd: function () {
                    divider.update();
                    divider.savePosition();
                },
                onRelease: function () {
                    this.target.classList.remove('ge-divider-is-dragging');
                }
            });
        }

        // CREATE AND START GLSLCANVAS
        this.canvasDOM = document.createElement('canvas');
        this.canvasDOM.setAttribute('class', 'ge_canvas');
        this.canvasDOM.setAttribute('width', options.viewSize || '384');
        this.canvasDOM.setAttribute('height', options.viewSize || '384');
        this.canvasDOM.setAttribute('animate', 'true');
        this.canvasDOM.setAttribute('data-fragment', options.frag);

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

    savePosition() {

    }

    getStartingPosition() {
        return this.container.offsetWidth / 2;
    }

    reflow() {
        // let mapEl = document.getElementById('map-container');
        // let contentEl = document.getElementById('content');
        // let menuEl = document.querySelector('.ge-menu-container');
        // let menuBottom = menuEl.getBoundingClientRect().bottom;
        // let positionX = this.el.getBoundingClientRect().left;

        // mapEl.style.width = positionX + 'px';
        // contentEl.style.width = (window.innerWidth - positionX) + 'px';

        // editor.setSize('100%', (window.innerHeight - menuBottom) + 'px');
        // this.container.style.height = (window.innerHeight - menuBottom) + 'px';

        // Triggers resize event to reposition editor widgets
        // Sends positioning data to subscribers
        // TangramPlay.trigger('resize', {
        //     mapX: positionX,
        //     contentX: window.innerWidth - positionX
        // });
    }

    update() {
        if (this.options.divider) {
            this.draggable[0].applyBounds(getBounds());
        }
    }
}

function getBounds(container) {
    return {
        minX: SHADER_MINIMUM_WIDTH,
        maxX: container.offsetWidth - CM_MINIMUM_WIDTH
    };
}