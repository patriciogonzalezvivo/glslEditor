import ExportModal from './modals/ExportModal';

export default class ExportIcon {
    constructor (main) {
        this.main = main;

        this.el = document.createElement('div');
        this.el.setAttribute('class', 'ge_export_icon');
        this.el.innerHTML = '△';
        // this.el.innerHTML = '<i class="material-icons">more_vert</i>';
        this.el.addEventListener('click', (event) => {
            if (main.change || !this.modal) {
                this.modal = new ExportModal('ge_export', { main: main });
            }
            this.modal.presentModal(event.target.offsetLeft, event.target.offsetTop);
        }, true);

        this.main.container.appendChild(this.el);
    }
}
