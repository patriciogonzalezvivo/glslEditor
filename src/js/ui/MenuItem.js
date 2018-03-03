export default class MenuItem {
    constructor (container, className, name, onClick) {
        this.el = document.createElement('li');
        this.button = document.createElement('button');
        this.button.className = className+'_button';
        this.el.appendChild(this.button);
        this.el.setAttribute('class', className);
        this.button.innerHTML = name;
        this.className = className;
        this.hiddenClass = className + '--hidden';

        // Attach listeners, including those for tooltip behavior
        this.button.addEventListener('click', onClick, true);

        if (container) {
            container.appendChild(this.el);
        }
    }

    set name (name) {
        this.button.innerHTML = name;
    }

    hide () {
        this.el.setAttribute('class', this.className + ' ' + this.hiddenClass);
    }

    show () {
        this.el.setAttribute('class', this.className);
    }
}
