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

        // document.body.addEventListener("mouseup", (event) => {
        //     console.log('MouseUp', event);
        // });

        let wrapper = this.main.editor.getWrapperElement();
        wrapper.addEventListener("mouseup", (event) => {
            // bail out if we were doing a selection and not a click
            if (this.main.editor.somethingSelected()) {
                return;
            }

            // console.log('onClick', event);
            let cursor = this.main.editor.getCursor(true);
            let token = this.main.editor.getTokenAt(cursor);
            // console.log(cursor,token);

            // see if there is a match on the cursor click
            let colorMatch = this.getMatch(cursor, 'color');
            if (colorMatch) {

                // Toggles the picker to be off if it's already present.
                if (this.picker && this.picker.isVisible) {
                    this.picker.removeModal();
                    return;
                }
                // If no picker is created yet, do it now
                else if (!this.picker) {
                    this.picker = new ColorPickerModal(colorMatch.string);
                }
                else {
                    this.picker.setColor(colorMatch.string);
                }

                // Turn the picker on and present modal at the desired position
                // let pos = this.el.getBoundingClientRect();
                // this.picker.presentModal(pos.left + MODAL_X_OFFSET, pos.bottom + MODAL_Y_OFFSET);
                let topOffset = 220;
                let topBoundary = 250;
                let bottomOffset = 16;
                let leftOffset = 75;
                let cursorOffset = this.main.editor.cursorCoords(true, "page");
                let leftBase = this.main.editor.cursorCoords(true, "page").left;
                let pickerTop = (cursorOffset.top);// - topOffset);
                if (cursorOffset.top < topBoundary) {
                    pickerTop = (cursorOffset.top + bottomOffset)
                }
                let pickerLeft = leftBase;// - leftOffset;
                this.picker.presentModal(pickerLeft, pickerTop);

                // Note: this fires change events as a live preview of the color.
                // TODO: Store original value so we can go back to it if the
                // interaction is canceled.
                this.picker.on('changed',() => {
                    console.log(this.picker.lib.getString('vec'));
                });

                return
            } 

            let numberMatch = this.getMatch(cursor, 'number');
            if (numberMatch) {
                let value = parseFloat(numberMatch.string);
                // console.log("Number", value);
            }
        });
    }

    getMatch (cursor, type) {
        if (!type) return;
        let re;
        switch(type.toLowerCase()) {
            case 'color':
                re = /vec[3|4]\([\d|.|,\s]*\)/g;
                break;
            case 'number':
                re = /[-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
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