import { isCommented, isLineAfterMain, getVariableType, getShaderForTypeVarInLine, getResultRange, getDeltaSum, getHits, getMedian } from '../tools/debugging';
import { unfocusLine, focusLine, unfocusAll, focusAll } from '../core/Editor.js';

var main_ge = {};
var N_SAMPLES = 30;

export default class VisualDebugger {
    constructor (main) {
        this.main = main;
        this.breakpoint = null;
        main_ge = main;

        this.testing = false;
        this.testingFrag = "";
        this.testingLine = 0;
        this.testingResults = [];
        this.testingSamples = [];

        this.main.editor.on('gutterClick', (cm, n) => {
            let info = cm.lineInfo(n);
            if (info && info.gutterMarkers && info.gutterMarkers.breakpoints) {
                // Check for an active variable (a variable that have been declare or modify in this line)
                let variableRE = new RegExp('\\s*[float|vec2|vec3|vec4]?\\s+([\\w|\\_]*)[\\.\\w]*?\\s+[\\+|\\-|\\\\|\\*]?\\=', 'i');
                let match = variableRE.exec(info.text);
                if (match) {
                    this.debug(match[1], info.line);
                    this.breakpoint = info.line;
                }
            }
        });
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
                let pct = (results[i].delta/sum)*100;
                let size = (results[i].delta/sum)*30;
                let marker_html = '<div>' +results[i].ms.toFixed(2);
                if (results[i].delta > 0.) {
                    marker_html += '<span class="ge_assing_marker_pct ';
                    if ( pct > (100.0/hits) ) {
                        marker_html += 'ge_assing_marker_slower';
                    }
                    marker_html += '" style="width: '+size.toFixed(0)+'px;" data="'+pct.toFixed(0)+'%"></span>'
                }
                
                cm.setGutterMarker(results[i].line, 'breakpoints', makeMarker(marker_html+'</div>'));
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
                let type = getVariableType(cm, variable);
                if (type === 'none') {
                    // If it fails on finding the type keep going with the test on another line
                    visualDebugger.testLine(nLine+1);
                    return;
                }

                // Prepare 
                visualDebugger.testing = true;
                visualDebugger.testingLine = nLine;
                visualDebugger.testingFrag = getShaderForTypeVarInLine(cm, type, variable, nLine);
                visualDebugger.testingSamples = [];

                unfocusAll(cm);
                focusLine(cm, nLine);
                main_ge.debugging = true;

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

            if (visualDebugger.testingSamples.length < N_SAMPLES-1){
                visualDebugger.testingSamples.push(elapsedMs);
                shader.test(visualDebugger.onTest, visualDebugger.testingFrag);
            } else {
                focusAll(cm);
                main_ge.debugging = false;
                visualDebugger.testingSamples.push(elapsedMs);
                elapsedMs = getMedian(visualDebugger.testingSamples);

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
            };
            
        } else {
            console.log(target)
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
        if (this.main.debbuging && this.variable === this.variable) {
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
        if (event && event.target && event.target.className === 'ge_assing_marker') {
            return;
        }

        let cm = this.main.editor;
        cm.clearGutter('breakpoints');
        if (this.overlay) {
            cm.removeOverlay(this.overlay, true);
        }
        this.type = null;
        if (this.main.debbuging) {
            this.main.shader.canvas.load(this.main.options.frag_header + this.main.editor.getValue() + this.main.options.frag_footer);
        }
        this.main.debbuging = false;
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
