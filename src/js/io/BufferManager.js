'use strict';

// Import CodeMirror
import CodeMirror from 'codemirror';
import 'codemirror/mode/clike/clike.js';

export default class BufferManager {
	constructor (main) {
		this.main = main;
		this.buffers = {};
		this.tabs = {};
		this.current = 'Default';

		this.el = document.createElement('ul');
		this.el.className = 'ge_panel';
	}

	new (name, content) {
		if (this.panel === undefined) {
			this.panel = this.main.editor.addPanel(this.el, {position: 'top'});
			this.new('Default', this.main.getContent());
		}
		this.buffers[name] = CodeMirror.Doc(content, 'x-shader/x-fragment');

		let tab = document.createElement('li');
		tab.setAttribute('class', 'ge_panel_tab');
		tab.textContent = name;
		CodeMirror.on(tab, 'click', () => {
			console.log(name);
			this.select(name);
		});

		if (name !== 'Default'){
			let close = tab.appendChild(document.createElement('a'));
			close.textContent = 'x';//'✖';
			close.setAttribute('class', 'ge_panel_tab_close');
			CodeMirror.on(close, 'click', () => {
				if (name === this.getCurrent()) {
					this.select('Default');
				}
		    	this.el.removeChild(tab);
		    	this.tabs[name] = undefined;
		    	this.buffers[name] = undefined;
			});
		}
		this.el.appendChild(tab);
		this.tabs[name] = tab;
	}

	select (name) {
		let buf = this.buffers[name];

		if (buf.getEditor()) {
			buf = buf.linkedDoc({sharedHist: true});
		}
		let old = this.main.editor.swapDoc(buf);
		let linked = old.iterLinkedDocs(function(doc) {
			linked = doc;
		});
		if (linked) {
		    // Make sure the document in buffers is the one the other view is looking at
		    for (var name in this.buffers) {
		    	if (this.buffers[name] === old) {
		    		this.buffers[name] = linked;
		    	}
		    }
		    old.unlinkDoc(linked);
		}
		this.main.editor.focus();
		this.main.setContent(this.main.getContent());

		if (this.tabs[this.current]) {
			this.tabs[this.current].setAttribute('class', 'ge_panel_tab');
		}
		
		this.tabs[name].setAttribute('class', 'ge_panel_tab_active');
		this.current = name;
	}

	delete (name) {

	}

	getCurrent () {

	}

	getLength () {
		return Object.keys(this.buffers).length;
	}
}