export default class Compiler {

    constructor (main) {
        this.LIVE_VARIABLE = 'u_ge_live_variable';
        this.header = '';
        this.main = main;
        this.main.editor.on('change', this.onChange.bind(this));
    }

    replaceRange (replacement, start, end) {
        this.liveVariable = {
            start: start,
            end: {
                line: end.line,
                ch: start.ch + replacement.length
            }
        };
        var newValue = this.variableValue(replacement);
        var type = this.variableType(replacement);
        this.setUniform = function() {
            this.main.shader.canvas.uniform('3f', 'vec3', this.LIVE_VARIABLE, newValue[0], newValue[1], newValue[2]);
        }
        this.setUniform();
        this.header = 'uniform ' + type + ' ' + this.LIVE_VARIABLE + ';';
        this.main.editor.replaceRange(replacement, start, end);
    }

    onChange () {
        this.updateShader([
            this.main.options.frag_header,
            this.header,
            this.getValue(),
            this.main.options.frag_footer
        ].join(''));
    }

    updateShader (glsl) {
        if (this.glsl !== glsl) {
            this.main.shader.canvas.load(glsl);
            this.setUniform && this.setUniform();
            this.glsl = glsl;
        }
    }

    getValue () {
        var value = this.main.editor.getValue();
        if ( ! this.liveVariable) {
            return value;
        }
        var doc = this.main.editor.getDoc();
        var start = doc.indexFromPos(this.liveVariable.start);
        var end = doc.indexFromPos(this.liveVariable.end);
        var len = end - start;
        delete this.liveVariable;
        return value.substr(0, start) + this.LIVE_VARIABLE + value.substr(end);
    }

    variableType (string) {
        return 'vec3';
    }

    variableValue (string) {
        var match = string.match(/\(([^,]*),([^,]*),([^,]*)\)/);
        return [
            parseFloat(match[1], 10),
            parseFloat(match[2], 10),
            parseFloat(match[3], 10)
        ];
    }
}
