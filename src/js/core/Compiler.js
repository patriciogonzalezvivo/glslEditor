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
        var type = this.variableType(value);
        var newValue = this.variableValue(value);
        var method = this.variableMethod(type);
        this.setUniform = function() {
            this.main.shader.canvas.uniform.apply(
                this.main.shader.canvas,
                [
                    method,
                    type,
                    this.LIVE_VARIABLE
                ].concat(newValue)
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

    variableType (value) {
        if (value instanceof Color) {
            if (value.colors.alpha) {
                return 'vec4';
            }
            return 'vec3';
        } else if (value instanceof Vector) {
            return 'vec' + value.dim;
        }
        return 'float';
    }

    variableValue (value) {
        if (value instanceof Color) {
            var vec = value.get('vec')
            var arr = [vec.v, vec.e, vec.c];
            if (value.colors.alpha) {
                arr.push(value.colors.alpha);
            }
            return arr;
        } else if (value instanceof Vector) {
            var arr = [];
            for (let i = 0; i < value.dim; i++) {
                arr.push(value.value[i]);
            }
            return arr;
        }
        return [value];
    }

    variableMethod (type) {
        if (type == 'vec4') {
            return '4f';
        } else if (type == 'vec3') {
            return '3f';
        } else if (type == 'vec2') {
            return '2f';
        }
        return '1f';
    }
}
