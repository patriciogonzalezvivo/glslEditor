'use strict';

import ColorPickerModal from 'app/ui/modals/ColorPickerModal';
import TrackPadModal from 'app/ui/modals/TrackPadModal';
import SliderModal from 'app/ui/modals/SliderModal';
import ToolTipModal from 'app/ui/modals/ToolTipModal';

// Return all pattern matches with captured groups
RegExp.prototype.execAll = function(string) {
    let match = null;
    let matches = new Array();
    while (match = this.exec(string)) {
        let matchArray = [];
        for (let i in match) {
            if (parseInt(i) == i) {
                matchArray.push(match[i]);
            }
        }
        matchArray.index = match.index;
        matches.push(matchArray);
    }
    return matches;
}

export default class Helpers {
    constructor (main) {
        this.main = main;

        // EVENTS
        let wrapper = this.main.editor.getWrapperElement();
        wrapper.addEventListener("mouseup", (event) => {
            // bail out if we were doing a selection and not a click
            if (this.main.editor.somethingSelected()) {
                return;
            }

            let cursor = this.main.editor.getCursor(true);

            // see if there is a match on the cursor click
            let match = this.getMatch(cursor);
            let token = this.main.editor.getTokenAt(cursor);
            if (match) {
                // Toggles the trackpad to be off if it's already present.
                if (this.activeModal && this.activeModal.isVisible) {
                    this.activeModal.removeModal();
                    return;
                }

                if (match.type === 'color') {
                    this.activeModal = new ColorPickerModal(match.string);
                    this.activeModal.showAt(this.main.editor);
                    this.activeModal.on('changed',(color) => {
                        let newColor = color.getString('vec');
                        let start = {"line":cursor.line, "ch":match.start};
                        let end = {"line":cursor.line, "ch":match.end};
                        match.end = match.start+newColor.length;
                        this.main.editor.replaceRange(newColor, start, end);
                    });
                }
                else if (match.type === 'pos') {
                    this.activeModal = new TrackPadModal(match.string);
                    this.activeModal.showAt(this.main.editor);
                    this.activeModal.on('changed',(pos) => {
                        let newpos = pos.getString();
                        let start = {"line":cursor.line, "ch":match.start};
                        let end = {"line":cursor.line, "ch":match.end};
                        match.end = match.start+newpos.length;
                        this.main.editor.replaceRange(newpos, start, end);
                    });
                }
                else if (match.type === 'number') {
                    this.activeModal = new SliderModal(match.string);
                    this.activeModal.showAt(this.main.editor);
                    this.activeModal.on('changed',(string) => {
                        let start = {"line":cursor.line, "ch":match.start};
                        let end = {"line":cursor.line, "ch":match.end};
                        match.end = match.start+string.length;
                        this.main.editor.replaceRange(string, start, end);
                    });
                }
            } 
            else if (token.type === 'builtin' || token.type === 'variable-3') {
                this.activeModal = new ToolTipModal( (token.type === 'builtin'? 'Function ' : 'Variable type ') + token.string + (token.type === 'builtin'? '() ...' : ' ...') ,'http://thebookofshaders.com/glossary/?search='+token.string);
                this.activeModal.showAt(this.main.editor);
            }
            else if (token.type === 'variable') {
                console.log('Token', token);
                let cm = this.main.editor;
                let nLines = cm.getDoc().size;

                let count = 0;
                let re = new RegExp('[\\s+]('+token.string+')[\\s|\\.|x|y|z|w|r|g|b|a|s|t|p|q]+[\\*|\\+|\-|\\/]?=','i');

                function makeMarker() {
                  var marker = document.createElement('div');
                  marker.style.color = '#282';
                  marker.innerHTML = '●';
                  return marker;
                }

                for (let i = 0; i < nLines; i++) {
                    let line = cm.getLine(i);
                    let match = re.exec(line);
                    if (match) {
                        let info = cm.lineInfo(i);
                        cm.setGutterMarker(i, 'var-in', makeMarker());
                        console.log(i, match, info);
                    }
                }
            }
            else {
                console.log('Token', token.type, token);
            }
        });
    }

    getMatch (cursor) {
        let types = ['color', 'pos', 'number'];
        let rta = undefined;
        for (let i in types) {
            rta = this.getTypeMatch(cursor, types[i]);
            if (rta) {
                return rta;
            }
        }   
        return;
    }

    getTypeMatch (cursor, type) {
        if (!type) return;
        let re;
        switch(type.toLowerCase()) {
            case 'number':
                re = /[-]?\d+\.\d+/g;
                break;
            case 'pos':
                re = /vec2\([-|\d|.|,\s]*\)/g;
                break;
            case 'color':
                re = /vec[3|4]\([\d|.|,\s]*\)/g;
                break;
            default:
                throw new Error("invalid match selection");
                return;
        }
        let line = this.main.editor.getLine(cursor.line);
        let matches = re.execAll(line);

        if (matches) {
            for (let i = 0; i < matches.length; i++) {
                let val = matches[i][0];
                let len = val.length;
                let start = matches[i].index;
                let end = matches[i].index + len;
                if (cursor.ch >= start && cursor.ch <= end) {
                    return {
                        type: type,
                        start: start,
                        end: end,
                        string: val
                    };
                }
            }
        }
        return;
    }
}