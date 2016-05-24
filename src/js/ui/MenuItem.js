export default class MenuItem {
    constructor (container, className, name, onClick) {
        this.el = document.createElement('li');
        this.el.setAttribute('class', className);
        this.el.innerHTML = name;
        this.className = className;
        this.hiddenClass = className + '--hidden';

        // Attach listeners, including those for tooltip behavior
        this.el.addEventListener('click', (event) => {
            // Execute onClick callback
            onClick(event);
        }, true);

        if (container) {
            container.appendChild(this.el);
        }
    }

    set name (name) {
        this.el.innerHTML = name;
    }

    hide () {
        this.el.setAttribute('class', this.className + ' ' + this.hiddenClass);
    }

    show () {
        this.el.setAttribute('class', this.className);
    }
}
