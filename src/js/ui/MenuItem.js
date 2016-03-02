export default class MenuItem {
    constructor (container, className, name, onClick) {
        this.el = document.createElement('li');
        this.el.setAttribute('class', className);
        this.el.innerHTML = name;

        // Attach listeners, including those for tooltip behavior
        this.el.addEventListener('click', (event) => {
            // Execute onClick callback
            onClick(event);
        }, true);

        if (container) {
            container.appendChild(this.el);
        }
    }
}
