'use strict';

export default class VisualDebugger {
    constructor (main) {
    	this.main = main;
    }

    iluminate(variable) {
    	console.log(variable)
    	let cm = this.main.editor;
        let nLines = cm.getDoc().size;

        // let [int|bool|float|vec\d]\s+(st)[\;|\=|\s] 

        let var_assigned = [];
        let re = new RegExp('[\\s+]('+variable+')[\\s|\\.|x|y|z|w|r|g|b|a|s|t|p|q]+[\\*|\\+|\-|\\/]?=','i');
        for (let i = 0; i < nLines; i++) {
            let match = re.exec(cm.getLine(i));
            if (match) {
                cm.setGutterMarker(i, 'var-in', makeMarker());
                console.log(i, match);
                var_assigned.push(i);
            }
        }
    }
}

function makeMarker() {
    let marker = document.createElement('div');
    marker.style.color = '#444';
    marker.innerHTML = '&#10095;';
    return marker;
}