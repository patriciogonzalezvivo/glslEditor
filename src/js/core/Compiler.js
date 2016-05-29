import Color from '../ui/pickers/types/Color';
import Vector from '../ui/pickers/types/Vector';

export default class Compiler {

    constructor (main) {
        this.LIVE_VARIABLE = 'u_ge_live_variable';
        this.header = '';
        this.main = main;
        this.main.editor.on('change', this.onChange.bind(this));
    }

    liveVariable (value, replacement, start, end) {
        this.liveVariablePosition = {
            start: start,
            end: {
                line: end.line,
                ch: start.ch + replacement.length
            }
        };
        var type = value.uniformType();
        var uniformValue = value.uniformValue();
        var method = value.uniformMethod();
        this.setUniform = function() {
            this.main.shader.canvas.uniform.apply(
                this.main.shader.canvas,
                [
                    method,
                    type,
                    this.LIVE_VARIABLE
                ].concat(uniformValue)
            );
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
        if ( ! this.liveVariablePosition) {
            return value;
        }
        var doc = this.main.editor.getDoc();
        var start = doc.indexFromPos(this.liveVariablePosition.start);
        var end = doc.indexFromPos(this.liveVariablePosition.end);
        var len = end - start;
        delete this.liveVariablePosition;
        return value.substr(0, start) + this.LIVE_VARIABLE + value.substr(end);
    }
}
