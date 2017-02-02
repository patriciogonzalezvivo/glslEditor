import { isCommented, getVariableType, getShaderForTypeVarInLine } from '../tools/debugging';

var main_ge = {};
var frames_counter = 0;
var frames_max = 100;

export default class VisualDebugger {
    constructor (main) {
        this.main = main;
        this.debbuging = false;
        this.active = null;
        main_ge = main;

        this.testing = false;
        this.testingLine = 0;
        this.testingLoaded = false;
        main.shader.canvas.on('load', this.onLoad);
        main.shader.canvas.on('render', this.onRender);
    }

    check() {
        let cm = this.main.editor;
        let nLines = cm.getDoc().size;
        let shader = this.main.shader.canvas;
        let total_delta = shader.timeDelta;
        console.log('check: ', total_delta);

        let voidRE = new RegExp('void main\\s*\\(\\s*[void]*\\)\\s*', 'i');
        let mainStartsAt = 0;
        for (let i = 0; i < nLines; i++) {
            // Do not start until being inside the main function
            let voidMatch = voidRE.exec(cm.getLine(i));
            if (voidMatch) {
                mainStartsAt = i;
            }
        }
        this.testLine(mainStartsAt);
    }

    testLine(nLine) {
        let cm = main_ge.editor;
        let shader = main_ge.shader.canvas;
        let visualDebugger = main_ge.visualDebugger;
        let nLines = cm.getDoc().size;
        if (nLine >= nLines) {
            console.log('End of file');
            visualDebugger.testingLine = 0;
            visualDebugger.testing = false;
            let frag = main_ge.options.frag_header + cm.getValue() + main_ge.options.frag_footer;
            shader.load(frag);
            shader.forceRender = true;
            return;
        }

        let variableRE = new RegExp('\\s*[float|vec2|vec3|vec4]?\\s+([\\w|\\_]*)[\\.\\w]*?\\s+[\\+|\\-|\\\\|\\*]?\\=', 'i');
        let match = variableRE.exec(cm.getLine(nLine));
        if (match) {
            let variable = match[1];
            let type = getVariableType(cm, variable)
            if (type === 'none'){
                visualDebugger.testLine(nLine+1);
                return;
            }

            let frag = getShaderForTypeVarInLine(cm, type, variable, nLine)+'\n\/\/u_time;\n\n';
            visualDebugger.testing = true;
            visualDebugger.testingLine = nLine;
            visualDebugger.testingLoaded = false;
            shader.load(frag);
            shader.forceRender = true;
            // console.log('Loading something to test', type, variable);
        } else {
            visualDebugger.testLine(nLine+1);
        }
    }

    onLoad() {
        if (main_ge.visualDebugger.testing) {
            frames_counter = 0;
            main_ge.visualDebugger.testingLoaded = true;
        }
    }

    onRender() {
        let shader = main_ge.shader.canvas;
        let cm = main_ge.editor;
        let visualDebugger = main_ge.visualDebugger;

        if (visualDebugger.testing && visualDebugger.testingLoaded) {
            if (shader.isValid) {
                frames_counter++;

                if (frames_counter > frames_max) {
                    console.log('Testing line:', visualDebugger.testingLine, shader.timeDelta);
                    let marker = document.createElement('div');
                    marker.setAttribute('class', 'ge_assing_marker');
                    marker.innerHTML = shader.timeDelta.toString();
                    cm.setGutterMarker( visualDebugger.testingLine, 
                                        'breakpoints', 
                                        marker);

                    visualDebugger.testing = false;
                    visualDebugger.testingLoaded= false;
                    frames_counter = 0;
                    visualDebugger.testLine(visualDebugger.testingLine+1);
                }
            } else {
                if (main_ge.errorsDisplay) {
                    main_ge.errorsDisplay.clean();
                }
            }
        }
    }

    iluminate (variable) {
        if (this.debbuging && this.variable === this.variable) {
            return;
        }
        // this.clean();

        let cm = this.main.editor;

        // Highlight all calls to a variable
        this.overlay = searchOverlay(variable, true);
        cm.addOverlay(this.overlay);
        if (cm.showMatchesOnScrollbar) {
            if (this.annotate) {
                this.annotate.clear(); this.annotate = null;
            }
            this.annotate = cm.showMatchesOnScrollbar(variable, true);
        }
    }

    clean (event) {
        if (event && event.target && (event.target.className === 'ge_assing_marker' || event.target.className === 'ge_assing_marker_on')) {
            return;
        }

        let cm = this.main.editor;
        cm.clearGutter('breakpoints');
        if (this.overlay) {
            cm.removeOverlay(this.overlay, true);
        }
        // this.variable = null;
        this.type = null;
        if (this.debbuging) {
            this.main.shader.canvas.load(this.main.options.frag_header + this.main.editor.getValue() + this.main.options.frag_footer);
        }
        this.debbuging = false;
        if (this.active) {
            this.active.setAttribute('class', 'ge_assing_marker');
        }
        this.active = false;
    }
}

function makeMarker(line, simbol) {
    let marker = document.createElement('div');
    marker.setAttribute('class', 'ge_assing_marker');
    marker.innerHTML = simbol;
    return marker;
}

function searchOverlay(query, caseInsensitive) {
    if (typeof query === 'string') {
        query = new RegExp(query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'), caseInsensitive ? 'gi' : 'g');
    }
    else if (!query.global) {
        query = new RegExp(query.source, query.ignoreCase ? 'gi' : 'g');
    }

    return {
        token: function(stream) {
            query.lastIndex = stream.pos;
            var match = query.exec(stream.string);
            if (match && match.index === stream.pos) {
                stream.pos += match[0].length || 1;
                return 'searching';
            }
            else if (match) {
                stream.pos = match.index;
            }
            else {
                stream.skipToEnd();
            }
        }
    };
}
