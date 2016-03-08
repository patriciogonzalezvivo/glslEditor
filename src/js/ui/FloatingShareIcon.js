import ShareModal from 'app/ui/modals/ShareModal';

export default class FloatingShareIcon {
    constructor (main) {
        this.main = main;

        this.el = document.createElement('div');
        this.el.setAttribute('class', 'ge_floating_share_icon');
        this.el.innerHTML = '&#10547';
        this.el.addEventListener('click', (event) => {
            if (main.change || !this.shareModal) {
                this.shareModal = new ShareModal('ge_share', { main: main });
            }
            this.shareModal.presentModal(event.target.offsetLeft, event.target.offsetTop);
        }, true);

        this.main.container.appendChild(this.el);
    }
}