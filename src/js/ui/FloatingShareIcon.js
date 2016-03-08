import ShareModal from 'app/ui/modals/ShareModal';

export default class FloatingShareIcon {
    constructor (main) {
        this.main = main;

        this.el = document.createElement('div');
        this.el.setAttribute('class', 'ge_floating_share_icon');
        this.el.innerHTML = '&#10547';
        this.el.addEventListener('click', (event) => {
            console.log(event);

            if (main.change || !this.shareModal) {
                this.shareModal = new ShareModal('ge_share', { main: main });
            }

            let bbox = this.el.getBoundingClientRect();
            this.shareModal.presentModal(bbox.left, bbox.top);
        }, true);

        this.main.container.appendChild(this.el);
    }
}