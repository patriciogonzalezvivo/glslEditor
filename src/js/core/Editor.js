// Import CodeMirror
import CodeMirror from 'codemirror';

// Import CodeMirror addons and modules
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/wrap/hardwrap';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/indent-fold';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/javascript-hint';
import 'codemirror/addon/display/rulers';
import 'codemirror/addon/display/panel';
import 'codemirror/mode/clike/clike.js';

// Keymap
import 'codemirror/keymap/sublime';

const UNFOCUS_CLASS = 'ge_editor-unfocus';

export function initEditor (main) {
    if (main.options.lineNumbers === undefined) {
        main.options.lineNumbers = true;
    }

    // CREATE AND START CODEMIRROR
    let el = document.createElement('div');
    el.setAttribute('class', 'ge_editor');
    
    // If there is a menu offset the editor to come after it
    if (main.menu) {
        el.style.paddingTop = (main.menu.el.clientHeight || main.menu.el.offsetHeight || main.menu.el.scrollHeight) + "px";
    }
    
    main.container.appendChild(el);

    let cm = CodeMirror(el, {
        value: main.options.frag,
        viewportMargin: Infinity,
        lineNumbers: main.options.lineNumbers,
        matchBrackets: true,
        mode: 'x-shader/x-fragment',
        keyMap: 'sublime',
        autoCloseBrackets: true,
        extraKeys: { 'Ctrl-Space': 'autocomplete' },
        showCursorWhenSelecting: true,
        theme: main.options.theme,
        dragDrop: false,
        indentUnit: 4,
        gutters: main.options.lineNumbers ? ['CodeMirror-linenumbers', 'breakpoints'] : false,
        lineWrapping: true,
        autofocus: true
    });
    return cm;
}

export function unfocusLine(cm, line) {
    if (line === null) return;
    cm.getDoc().addLineClass(line, 'gutter', UNFOCUS_CLASS);
    cm.getDoc().addLineClass(line, 'text', UNFOCUS_CLASS);
}

export function unfocusAll(cm) {
    for (let i = 0, j = cm.getDoc().lineCount(); i <= j; i++) {
        unfocusLine(cm, i);
    }
}

export function focusLine(cm, line) {
    if (line === null) return;
    cm.getDoc().removeLineClass(line, 'gutter', UNFOCUS_CLASS);
    cm.getDoc().removeLineClass(line, 'text', UNFOCUS_CLASS);
}

export function focusAll(cm) {
    for (let i = 0, j = cm.getDoc().lineCount(); i <= j; i++) {
        focusLine(cm, i);
    }
}
