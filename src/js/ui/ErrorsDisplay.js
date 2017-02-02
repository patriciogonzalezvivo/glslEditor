export default class ErrorsDisplay {
    constructor(main) {
        this.main = main;

        //  private variables
        this.widgets = [];

        // EVENTS
        this.main.shader.canvas.on('error', (arg) => {
            if (this.main.visualDebugger && this.main.visualDebugger.testing) {
                this.clean();
            } else {
                this.clean();
                this.addError(arg);
            }
        });

        this.main.editor.on('changes', (cm, changesObjs) => {
            if (this.main.shader.canvas.isValid) {
                this.clean();
            }
        });
    }

    clean() {
        for (let i = 0; i < this.widgets.length; i++) {
            this.main.editor.removeLineWidget(this.widgets[i]);
        }
        this.widgets.length = 0;
    }

    addError(args) {
        let re = /ERROR:\s+\d+:(\d+):\s+('.*)/g;
        let matches = re.exec(args.error);
        if (matches) {
            let line = parseInt(matches[1]) - 1;
            let er = matches[2];
            let msg = document.createElement('div');

            let icon = msg.appendChild(document.createElement('span'));
            icon.className = 'ge-error-icon';
            icon.innerHTML = 'x';
            msg.appendChild(document.createTextNode(er));
            msg.className = 'ge-error';
            this.widgets.push(this.main.editor.addLineWidget(line, msg));//, { coverGutter: false, noHScroll: true }));
        }
    }
}
