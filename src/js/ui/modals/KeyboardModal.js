import MenuItem from "../MenuItem";
import Modal from "./Modal";
// import { saveOnServer, createOpenFrameArtwork } from '../../io/share';

export default class KeyboardModal extends Modal {
  constructor(CSS_PREFIX, properties) {
    super(CSS_PREFIX, properties);
    this.main = properties.main;

    this.vim = new MenuItem(this.el, "ge_sub_menu", "Vim", (event) => {});

    this.sublime = new MenuItem(
      this.el,
      "ge_sub_menu",
      "Sublime",
      (event) => {}
    );
  }
}
