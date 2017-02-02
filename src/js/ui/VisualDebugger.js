import { isCommented, isLineAfterMain, getVariableType, getShaderForTypeVarInLine } from '../tools/debugging';

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
        this.testingFrag = "";
        this.testingLine = 0;
        this.testingResults = [];
    }

    check() {
        // Clean previus records
        this.testingResults = [];

        let cm = this.main.editor;
        let nLines = cm.getDoc().size;

        let mainStartsAt = 0;
        for (let i = 0; i < nLines; i++) {
            if (isLineAfterMain(cm, i)) {
                mainStartsAt = i;
                break;
            }
        }
        this.testLine(mainStartsAt);
    }

    testLine(nLine) {
        let cm = main_ge.editor;
        let visualDebugger = main_ge.visualDebugger;
        
        if (nLine >= cm.getDoc().size) {
            visualDebugger.testingLine = 0;
            visualDebugger.testing = false;
            return;
        }

        if (isLineAfterMain(cm, nLine)) {
            let shader = main_ge.shader.canvas;
            let variableRE = new RegExp('\\s*[float|vec2|vec3|vec4]?\\s+([\\w|\\_]*)[\\.\\w]*?\\s+[\\+|\\-|\\\\|\\*]?\\=', 'i');
            let match = variableRE.exec(cm.getLine(nLine));
            if (match) {
                let variable = match[1];
                let type = getVariableType(cm, variable)
                if (type === 'none') {
                    visualDebugger.testLine(nLine+1);
                    return;
                }

                visualDebugger.testing = true;
                visualDebugger.testingLine = nLine;
                visualDebugger.testingFrag = getShaderForTypeVarInLine(cm, type, variable, nLine);

                shader.test(this.onTest,  visualDebugger.testingFrag);
            } else {
                visualDebugger.testLine(nLine+1);
            }
        } else {
            visualDebugger.testLine(nLine+1);
        } 
    }

    onTest (target) {
        let cm = main_ge.editor;
        let shader = main_ge.shader.canvas;
        let visualDebugger = main_ge.visualDebugger;

        if (target.wasValid) {
            console.log('Testing line:', visualDebugger.testingLine, target.timeElapsedMs, target);
            let marker = document.createElement('div');
            marker.setAttribute('class', 'ge_assing_marker');
            marker.innerHTML = target.timeElapsedMs.toString();
            cm.setGutterMarker( visualDebugger.testingLine, 
                                'breakpoints', 
                                marker);

            visualDebugger.testingResults.push({line:visualDebugger.testingLine, ms:target.timeElapsedMs});

            visualDebugger.testLine(visualDebugger.testingLine+1);
        } else {
            console.log('Error at line ',visualDebugger.testingLine, target);
            visualDebugger.testLine(visualDebugger.testingLine+1);
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
