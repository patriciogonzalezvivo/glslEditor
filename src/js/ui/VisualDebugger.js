export default class VisualDebugger {
    constructor (main) {
        this.main = main;
        this.debbuging = false;
    }

    iluminate (variable) {
        this.clean();
        let cm = this.main.editor;
        let nLines = cm.getDoc().size;

        // Show line where the value of the variable is been asigned
        let constructRE = new RegExp('(float|vec\\d)\\s+(' + variable + ')', 'i');
        let assignRE = new RegExp('[\\s+](' + variable + ')[\\s|\\.|x|y|z|w|r|g|b|a|s|t|p|q]+[\\*|\\+|\-|\\/]?=', 'i');
        for (let i = 0; i < nLines; i++) {
            let constructMatch = constructRE.exec(cm.getLine(i));
            if (constructMatch && constructMatch[1]) {
                this.type = constructMatch[1];
                cm.setGutterMarker(i, 'var-in', makeMarker(this, i, '&#x2605;'));
            } else {
                let assignMatch = assignRE.exec(cm.getLine(i));
                if (assignMatch) {
                    cm.setGutterMarker(i, 'var-in', makeMarker(this, i, '&#8676;'));
                }
            }
        }

        // Highlight all calls to a variable
        this.overlay = searchOverlay(variable, true);
        cm.addOverlay(this.overlay);
        if (cm.showMatchesOnScrollbar) {
            if (this.annotate) {
                this.annotate.clear(); this.annotate = null;
            }
            this.annotate = cm.showMatchesOnScrollbar(this.query, queryCaseInsensitive(this.query));
        }

        this.variable = variable;
    }

    clean (event) {
        if (event && event.target && event.target.className === 'ge_assing_marker') {
            return;
        }

        let cm = this.main.editor;
        cm.clearGutter('var-in');
        if (this.overlay) {
            cm.removeOverlay(this.overlay, true);
        }
        this.variable = null;
        this.type = null;
        if (this.debbuging) {
             this.main.shader.canvas.load(this.main.options.frag_header + this.main.editor.getValue() + this.main.options.frag_footer);
        }
        this.debbuging = false;
    }

    debugLine (nLine) {
        if (this.type && this.variable) {
            console.log('Debug untile line', nLine);

            let cm = this.main.editor;
            let nLines = cm.getDoc().size;

            let frag = '';
            for (let i = 0; i < nLine+1; i++) {
                frag += cm.getLine(i) + '\n'; 
            }

            frag += '\tgl_FragColor = ';
            if (this.type === 'float') {
                frag += 'vec4(vec3('+ this.variable + '),1.)';
            }
            else if (this.type === 'vec2') {
                frag += 'vec4(vec3('+ this.variable + ',0.),1.)';
            }
            else if (this.type === 'vec3') {
                frag += 'vec4('+ this.variable + ',1.)';
            }
            else if (this.type === 'vec4') {
                frag += this.variable;
            }
            frag += ';\n}\n';

            this.main.shader.canvas.load(frag);
            this.debbuging = true;

            if (!glslEditor.shader.canvas.isValid) {
                console.log('Debugger did not work for', this.type, this.variable, ' , stoping');
                this.clean();
                if (this.main.errorsDisplay) {
                    this.main.errorsDisplay.clean();
                }
            }
        }
    }
}

function makeMarker(vd, line, simbol) {
    let marker = document.createElement('div');
    marker.setAttribute('class', 'ge_assing_marker');
    marker.innerHTML = simbol;
    marker.addEventListener('click', () => {
        vd.debugLine(line);
    });
    return marker;
}

function searchOverlay(query, caseInsensitive) {
    if (typeof query == 'string') {
        query = new RegExp(query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'), caseInsensitive ? 'gi' : 'g');
    }
    else if (!query.global) {
        query = new RegExp(query.source, query.ignoreCase ? 'gi' : 'g');
    }

    return {
        token: function(stream) {
            query.lastIndex = stream.pos;
            var match = query.exec(stream.string);
            if (match && match.index == stream.pos) {
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
