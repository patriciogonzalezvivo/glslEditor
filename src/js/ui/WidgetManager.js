'use strict';

import ColorPickerModal from 'app/ui/ColorPickerModal';
import Color from 'app/tools/Color';

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

export default class WidgetManager {
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
            if (match) {
                if (match.type === 'color') {
                    // Toggles the picker to be off if it's already present.
                    if (this.picker && this.picker.isVisible) {
                        this.picker.removeModal();
                        return;
                    }
                    // If no picker is created yet, do it now
                    else if (!this.picker) {
                        this.picker = new ColorPickerModal(match.string);
                    }
                    else {
                        this.picker.setColor(match.string);
                    }

                    this.picker.showAt(this.main.editor);
                    this.picker.on('changed',(color) => {
                        let newColor = color.getString('vec');
                        let start = {"line":cursor.line, "ch":match.start};
                        let end = {"line":cursor.line, "ch":match.end};
                        match.end = match.start+newColor.length;
                        this.main.editor.replaceRange(newColor, start, end);
                    });
                }
                else if (match.type === 'pos') {
                    console.log('Pos', match);
                }
                else if (match.type === 'number') {
                    console.log('Number', match);
                }
            } 
            else {
                let token = this.main.editor.getTokenAt(cursor);
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
                re = /[-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
                break;
            case 'pos':
                re = /vec2\([\d|.|,\s]*\)/g;
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