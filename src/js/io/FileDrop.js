/*
Original: https://github.com/tangrams/tangram-play/blob/gh-pages/src/js/addons/ui/FileDrop.js
Author: Lou Huang (@saikofish)
*/

export default class FileDrop {
    constructor (main) {
        // Set up drag/drop file listeners
        main.container.addEventListener('dragenter', (event) => {
            // Check to make sure that dropped items are files.
            // This prevents other drags (e.g. text in editor)
            // from turning on the file drop area.
            // See here: http://stackoverflow.com/questions/6848043/how-do-i-detect-a-file-is-being-dragged-rather-than-a-draggable-element-on-my-pa
            // Tested in Chrome, Firefox, Safari 8
            var types = event.dataTransfer.types;
            if (types !== null && ((types.indexOf) ? (types.indexOf('Files') !== -1) : types.contains('application/x-moz-file'))) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
            }
        }, true);

        main.container.addEventListener('dragover', (event) => {
            // Required to prevent browser from navigating to a file
            // instead of receiving a data transfer
            event.preventDefault();
        }, false);

        main.container.addEventListener('dragleave', (event) => {
            event.preventDefault();
        }, true);

        main.container.addEventListener('drop', (event) => {
            event.preventDefault();
            if (event.dataTransfer.files.length > 0) {
                const file = event.dataTransfer.files[0];
                main.open(file);
            }
        }, false);
    }
}
