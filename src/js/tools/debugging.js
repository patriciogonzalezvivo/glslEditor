
export function isCommented(cm, nLine, match) {
    let token = cm.getTokenAt({ line: nLine, ch: match.index });
    if (token && token.type) {
        return token.type === 'comment';
    }
    return false;
}

export function isLineAfterMain(cm, nLine) {
    let totalLines = cm.getDoc().size;
    let voidRE = new RegExp('void main\\s*\\(\\s*[void]*\\)', 'i');
    for (let i = 0; i < nLine && i < totalLines; i++) {
        // Do not start until being inside the main function
        let voidMatch = voidRE.exec(cm.getLine(i));
        if (voidMatch) {
            return true;
        }
    }
    return false;
}

export function getVariableType(cm, sVariable) {
    let nLines = cm.getDoc().size;

    // Show line where the value of the variable is been asigned
    let uniformRE = new RegExp('\\s*uniform\\s+(float|vec2|vec3|vec4)\\s+' + sVariable + '\\s*;');
    let voidRE = new RegExp('void main\\s*\\(\\s*[void]*\\)', 'i');
    let voidIN = false;
    let constructRE = new RegExp('(float|vec\\d)\\s+(' + sVariable + ')\\s*[;]?', 'i');
    for (let i = 0; i < nLines; i++) {
        if (!voidIN) {
            // Do not start until being inside the main function
            let voidMatch = voidRE.exec(cm.getLine(i));
            if (voidMatch) {
                voidIN = true;
            } else {
                let uniformMatch = uniformRE.exec(cm.getLine(i));
                if (uniformMatch && !isCommented(cm, i, uniformMatch)) {
                    return uniformMatch[1];
                }
            }
        }
        else {
            let constructMatch = constructRE.exec(cm.getLine(i));
            if (constructMatch && constructMatch[1] && !isCommented(cm, i, constructMatch)) {
                return constructMatch[1];
            }
        }
    }
    return 'none';
}

export function getShaderForTypeVarInLine(cm, sType, sVariable, nLine) {
    let frag = '';
    let offset = 1;
    for (let i = 0; i < nLine + 1 && i < cm.getDoc().size; i++) {
        if (cm.getLine(i)) {
            frag += cm.getLine(i) + '\n';
        }
    }

    frag += '\tgl_FragColor = ';
    if (sType === 'float') {
        frag += 'vec4(vec3(' + sVariable + '),1.)';
    }
    else if (sType === 'vec2') {
        frag += 'vec4(vec3(' + sVariable + ',0.),1.)';
    }
    else if (sType === 'vec3') {
        frag += 'vec4(' + sVariable + ',1.)';
    }
    else if (sType === 'vec4') {
        frag += sVariable;
    }
    frag += ';\n}\n';

    return frag;
}

export function getResultRange(test_results) {
    let min_ms = '10000000.0';
    let min_line = 0;
    let max_ms = '0.0';
    let max_line = 0;
    for (let i in test_results) {
        if (test_results[i].ms < min_ms) {
            min_ms = test_results[i].ms;
            min_line = test_results[i].line;
        }
        if (test_results[i].ms > max_ms) {
            max_ms = test_results[i].ms;
            max_line = test_results[i].line;
        }
    }
    return { min:{line: min_line, ms: min_ms}, max:{line: max_line, ms: max_ms} };
}

export function getMedian(values) {
    values.sort( function(a,b) {return a - b;} );

    var half = Math.floor(values.length/2);

    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
}

export function getDeltaSum(test_results) {
    let total = 0.0;
    for (let i in test_results) {
        if (test_results[i].delta > 0) {
            total += test_results[i].delta;
        }
    }
    return total;
}

export function getHits(test_results) {
    let total = 0;
    for (let i in test_results) {
        if (test_results[i].delta > 0) {
            total++;
        }
    }
    return total;
}