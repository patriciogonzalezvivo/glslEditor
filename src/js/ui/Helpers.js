'use strict';

import ColorPicker from 'app/ui/pickers/ColorPicker';
import Vec3Picker from 'app/ui/pickers/Vec3Picker';
import Vec2Picker from 'app/ui/pickers/Vec2Picker';
import FloatPicker from 'app/ui/pickers/FloatPicker';

import Color from 'app/ui/pickers/types/Color';
import { getColorAsRGB } from 'app/ui/pickers/types/ColorConverter';

// Return all pattern matches with captured groups
RegExp.prototype.execAll = function(string) {
    let match = null;
    let matches = [];
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
};

export default class Helpers {
    constructor (main) {
        this.main = main;

        let bgColor = new Color(getStyleProp(main.editor.getWrapperElement(), 'background'));
        let fgColor = new Color(getStyleProp(main.editor.getWrapperElement(), 'color'));

        this.properties = {
            bgColor: bgColor.getString('rgb'),
            fnColor: fgColor.getString('rgb'),
            dimColor: 'rgb(127, 127, 127)',
            selColor: 'rgb(40, 168, 107)',
            link_button: true
        }

        console.log(this.properties);

        // EVENTS
        let wrapper = this.main.editor.getWrapperElement();
        wrapper.addEventListener('mouseup', (event) => {
            this.main.editor.clearGutter('var-in');

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
                    this.activeModal = new ColorPicker(match.string, this.properties);
                    this.activeModal.showAt(this.main.editor);
                    this.activeModal.on('changed', (color) => {
                        let newColor = color.getString('vec');
                        let start = { line: cursor.line, ch: match.start };
                        let end = { line: cursor.line, ch: match.end };
                        match.end = match.start + newColor.length;
                        this.main.editor.replaceRange(newColor, start, end);
                    });

                    this.activeModal.on('link_button', (color) => {
                        this.activeModal = new Vec3Picker(color.getString('vec'), this.properties);
                        this.activeModal.showAt(this.main.editor);
                        this.activeModal.on('changed', (dir) => {
                            let newDir = dir.getString('vec3');
                            let start = { line: cursor.line, ch: match.start };
                            let end = { line: cursor.line, ch: match.end };
                            match.end = match.start + newDir.length;
                            this.main.editor.replaceRange(newDir, start, end);
                        });
                    });
                }
                if (match.type === 'vec3') {
                    this.activeModal = new Vec3Picker(match.string, this.properties);
                    this.activeModal.showAt(this.main.editor);
                    this.activeModal.on('changed', (dir) => {
                        let newDir = dir.getString('vec3');
                        let start = { line: cursor.line, ch: match.start };
                        let end = { line: cursor.line, ch: match.end };
                        match.end = match.start + newDir.length;
                        this.main.editor.replaceRange(newDir, start, end);
                    });
                }
                else if (match.type === 'vec2') {
                    this.activeModal = new Vec2Picker(match.string, this.properties);
                    this.activeModal.showAt(this.main.editor);
                    this.activeModal.on('changed', (pos) => {
                        let newpos = pos.getString();
                        let start = { line: cursor.line, ch: match.start };
                        let end = { line: cursor.line, ch: match.end };
                        match.end = match.start + newpos.length;
                        this.main.editor.replaceRange(newpos, start, end);
                    });
                }
                else if (match.type === 'number') {
                    this.activeModal = new FloatPicker(match.string, this.properties);
                    this.activeModal.showAt(this.main.editor);
                    this.activeModal.on('changed', (string) => {
                        let start = { line: cursor.line, ch: match.start };
                        let end = { line: cursor.line, ch: match.end };
                        match.end = match.start + string.length;
                        this.main.editor.replaceRange(string, start, end);
                    });
                }
            }
            else if (token.type === 'variable') {
                if (this.main.visualDebugger) {
                    this.main.visualDebugger.iluminate(token.string);
                }
            }
        });
    }

    getMatch (cursor) {
        let types = ['color', 'vec3' ,'vec2', 'number'];
        let rta;
        for (let i in types) {
            rta = this.getTypeMatch(cursor, types[i]);
            if (rta) {
                return rta;
            }
        }
        return;
    }

    getTypeMatch (cursor, type) {
        if (!type) {
            return;
        }
        let re;
        switch(type.toLowerCase()) {
            case 'color':
                re = /vec[3|4]\([\d|.|,\s]*\)/g;
                break;
            case 'vec3':
                re = /vec3\([-|\d|.|,\s]*\)/g;
                break;
            case 'vec2':
                re = /vec2\([-|\d|.|,\s]*\)/g;
                break;
            case 'number':
                re = /[-]?\d*\.\d*/g;
                break;
            default:
                console.error('invalid match selection');
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

function getStyleProp(elem, prop) {
    if(window.getComputedStyle)
        return window.getComputedStyle(elem, null).getPropertyValue(prop);
    else if(elem.currentStyle) return elem.currentStyle[prop]; //IE
}
