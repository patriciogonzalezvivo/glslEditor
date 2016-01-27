'use strict';

// import ColorPickerModal from 'ColorPickerModal';

export default class WidgetManager {
    constructor (main) {
        this.main = main;

        let wrapper = this.main.editor.getWrapperElement();
        wrapper.addEventListener("mouseup", (event) => {
            // bail out if we were doing a selection and not a click
            if (this.main.editor.somethingSelected()) {
                return;
            }

            console.log('onClick', event);
            let cursor = this.main.editor.getCursor(true);
            let token = this.main.editor.getTokenAt(cursor);
            console.log(cursor,token);

            // see if there is a match on the cursor click
            let numberMatch = this.getMatch(cursor, 'number');
            let vec3Match = this.getMatch(cursor, 'vec3');

            if (vec3Match) {
                let color = vec3Match.string;
                console.log(color);
                // color = Color.Space(color, "VEC3>RGB>W3");
                // picker = new thistle.Picker(color);
                // picker.setCSS(color);
                // picker.presentModal(pickerLeft,pickerTop)
                // picker.on('changed',function() {
                //   picked = picker.getCSS();
                //   //translate hsl return to rgb
                //   picked = Color.Space(picked, "W3>HSL>RGB>VEC3");
                //   pickerCallback(picked,'vec3')
                // })
            } 
            else if(numberMatch) {
                // slider.value = 0;
                let value = parseFloat(numberMatch.string);
                console.log(value);
                // let sliderRange = getSliderRange(value);
                // slider.setAttribute("value", value);
                // slider.setAttribute("step", sliderRange.step);
                // slider.setAttribute("min", sliderRange.min);
                // slider.setAttribute("max", sliderRange.max);
                // slider.value = value;

                // //setup slider position
                // // position slider centered above the cursor
                // let sliderTop = cursorOffset.top - y_offset;
                // let sliderStyle = window.getComputedStyle(sliderDiv);
                // let sliderWidth = getPixels(sliderStyle.width);
                // let sliderLeft = cursorOffset.left - sliderWidth/2;
                // sliderDiv.style.top = sliderTop - 10 + "px";
                // sliderDiv.style.left = sliderLeft + "px";

                // sliderDiv.style.visibility = "visible";
            } else {

            }
        });

        document.body.addEventListener("mouseup", (event) => {
            console.log('MouseUp', event);
        });
    }

    getMatch (cursor, type) {
        if (!type) return;
        var re;
        switch(type.toLowerCase()) {
            case 'vec3':
                re = /vec3\(\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*\)/;
                break;
            case 'vec4':
                re = /vec4\(\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*\)/;
                break;
            case 'number':
                re = /[-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
                break;
            default:
                throw new Error("invalid match selection");
                return;
        }
        var line = this.main.editor.getLine(cursor.line);
        var match = re.exec(line);
        while (match) {
            var val = match[0];
            var len = val.length;
            var start = match.index;
            var end = match.index + len;
            if (cursor.ch >= start && cursor.ch <= end) {
                match = null;
                return {
                    start: start,
                    end: end,
                    string: val
                };
            }
            match = re.exec(line);
        }
        return;
    }
}