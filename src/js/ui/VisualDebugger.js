export default class VisualDebugger {
    constructor (main) {
        this.main = main;
        this.debbuging = false;
        this.active = null;

        this.main.editor.on('gutterClick', (cm, n) => {
            let info = cm.lineInfo(n);
            if (info && info.gutterMarkers && info.gutterMarkers.breakpoints) {
                if (this.active) {
                    this.active.setAttribute('class', 'ge_assing_marker');
                }
                info.gutterMarkers.breakpoints.setAttribute('class', 'ge_assing_marker_on');
                this.debugLine(n);
                this.active = info.gutterMarkers.breakpoints;
            }
        });
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

        let nLines = cm.getDoc().size;

        // Show line where the value of the variable is been asigned
        let voidRE = new RegExp('void main\\s*\\(\\s*[void]*\\)\\s*\\{', 'i');
        let voidIN = false;
        let constructRE = new RegExp('(float|vec\\d)\\s+(' + variable + ')\\s+', 'i');
        let constructIN = false;
        let assignRE = new RegExp('[\\s+](' + variable + ')[\\s|\\.|x|y|z|w|r|g|b|a|s|t|p|q]+[\\*|\\+|\\-|\\/]?=', 'i');
        for (let i = 0; i < nLines; i++) {
            if (!voidIN) {
                // Do not start until being inside the main function
                let voidMatch = voidRE.exec(cm.getLine(i));
                if (voidMatch) {
                    voidIN = true;
                }
            }
            else {
                if (!constructIN) {
                    // Search for the constructor
                    let constructMatch = constructRE.exec(cm.getLine(i));
                    if (constructMatch && constructMatch[1] && !isCommented(cm, i, constructMatch)) {
                        this.type = constructMatch[1];
                        cm.setGutterMarker(i, 'breakpoints', makeMarker(this, i, '+'));//'&#x2605;'));
                        constructIN = true;
                    }
                }
                else {
                    // Search for changes on tha variable
                    let assignMatch = assignRE.exec(cm.getLine(i));
                    if (assignMatch && !isCommented(cm, i, assignMatch)) {
                        cm.setGutterMarker(i, 'breakpoints', makeMarker(this, i, '●'));// '<span style="padding-left: 3px;">●</span>'));
                    }
                }
            }
        }

        this.variable = variable;
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
        this.variable = null;
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

    debugLine (nLine) {
        if (this.type && this.variable) {
            let cm = this.main.editor;

            let frag = '';
            for (let i = 0; i < nLine + 1; i++) {
                frag += cm.getLine(i) + '\n';
            }

            frag += '\tgl_FragColor = ';
            if (this.type === 'float') {
                frag += 'vec4(vec3(' + this.variable + '),1.)';
            }
            else if (this.type === 'vec2') {
                frag += 'vec4(vec3(' + this.variable + ',0.),1.)';
            }
            else if (this.type === 'vec3') {
                frag += 'vec4(' + this.variable + ',1.)';
            }
            else if (this.type === 'vec4') {
                frag += this.variable;
            }
            frag += ';\n}\n';

            this.main.shader.canvas.load(frag);
            this.debbuging = true;

            if (!this.main.shader.canvas.isValid) {
                console.log('Something went wrong and the debugger did not work for', this.type, this.variable, ' , so I will stop and clean');
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

function isCommented(cm, nLine, match) {
    let token = cm.getTokenAt({ line: nLine, ch: match.index });
    if (token && token.type) {
        return token.type === 'comment';
    }
    return false;
}
