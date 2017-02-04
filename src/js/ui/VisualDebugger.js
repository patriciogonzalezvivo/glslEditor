import { isCommented, isLineAfterMain, getVariableType, getShaderForTypeVarInLine, getResultRange, getDeltaSum, getHits } from '../tools/debugging';
import { unfocusLine, focusLine, unfocusAll, focusAll } from '../core/Editor.js';

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
        
        // If is done testing...
        if (nLine >= cm.getDoc().size) {
            visualDebugger.testingLine = 0;
            visualDebugger.testing = false;

            let results = visualDebugger.testingResults;
            let range = getResultRange(results);
            let sum = getDeltaSum(results);
            let hits = getHits(results)

            console.log('Test: ',range.max.ms+'ms', results);
            cm.clearGutter('breakpoints');
            for (let i in results) {
                if (results[i].delta > 0.) {
                    let val = (results[i].delta/sum)*100;
                    let marker_html = val.toFixed(0)+'%';
                    if ( val > (100.0/hits) ) {
                        marker_html = '<span class="ge_assing_marker_slower">'+marker_html+'</span>';
                    }
                    cm.setGutterMarker(results[i].line, 'breakpoints', makeMarker(marker_html));
                }
            }
            return;
        }

        if (isLineAfterMain(cm, nLine)) {
            // If the line is inside the main function
            let shader = main_ge.shader.canvas;

            // Check for an active variable (a variable that have been declare or modify in this line)
            let variableRE = new RegExp('\\s*[float|vec2|vec3|vec4]?\\s+([\\w|\\_]*)[\\.\\w]*?\\s+[\\+|\\-|\\\\|\\*]?\\=', 'i');
            let match = variableRE.exec(cm.getLine(nLine));
            if (match) {
                // if there is an active variable, get what type is
                let variable = match[1];
                let type = getVariableType(cm, variable)
                if (type === 'none') {
                    // If it fails on finding the type keep going with the test on another line
                    visualDebugger.testLine(nLine+1);
                    return;
                }

                // Prepare 
                visualDebugger.testing = true;
                visualDebugger.testingLine = nLine;
                visualDebugger.testingFrag = getShaderForTypeVarInLine(cm, type, variable, nLine);

                shader.test(this.onTest,  visualDebugger.testingFrag);
            } else {
                visualDebugger.testLine(nLine+1);
            }
        } else {
            // If the line is not inside main function, test the next one...
            visualDebugger.testLine(nLine+1);
        } 
    }

    onTest (target) {
        let cm = main_ge.editor;
        let shader = main_ge.shader.canvas;
        let visualDebugger = main_ge.visualDebugger;

        // If the test shader compiled...
        if (target.wasValid) {
            // get data, process and store.
            let elapsedMs = target.timeElapsedMs;
            let range = getResultRange(visualDebugger.testingResults);
            let delta = elapsedMs - range.max.ms;
            if (visualDebugger.testingResults.length === 0) {
                delta = 0.0;
            }
            visualDebugger.testingResults.push({line:visualDebugger.testingLine, ms:target.timeElapsedMs, delta:delta});
            // console.log('Testing line:', visualDebugger.testingLine, elapsedMs, delta, range);

            // Create gutter marker
            cm.setGutterMarker( visualDebugger.testingLine, 
                                'breakpoints', 
                                makeMarker(elapsedMs.toFixed(2)));

            // Test next line
            visualDebugger.testLine(visualDebugger.testingLine+1);
        } else {
            // Test next line
            visualDebugger.testLine(visualDebugger.testingLine+1);
        }
    }

    debug (variable, nLine) {
        focusAll(this.main.editor);
        this.main.debugging = false;

        if (isLineAfterMain(this.main.editor, nLine)) {
            var type = getVariableType(this.main.editor, variable);
            if (type !== 'none') {
                event.preventDefault();
                this.main.shader.canvas.load(getShaderForTypeVarInLine(this.main.editor, type, variable, nLine));
                unfocusAll(this.main.editor);
                focusLine(this.main.editor, nLine);
                this.main.debugging = true;
            }
        } else {
            this.main.update();
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

function makeMarker(html,extra_class) {
    let marker = document.createElement('div');
    marker.setAttribute('class', 'ge_assing_marker' );
    marker.innerHTML = html;
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
