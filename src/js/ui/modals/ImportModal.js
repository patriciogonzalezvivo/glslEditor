/*
This file imports images and converts them into textures to be used in the current shader

Author: ChronoAndross (https://github.com/ChronoAndross)
Date: 02/03/2018

*/
import GlslCanvas from 'glslCanvas';
import MenuItem from '../MenuItem';
import Modal from './Modal';
import { saveOnServer, createOpenFrameArtwork } from '../../io/share';

export default class ImportModal extends Modal {
    constructor (CSS_PREFIX, properties) {
        super(CSS_PREFIX, properties);
        this.main = properties.main;

        // main method used for prompting the user for a path and sending it to loadImageFile
        this.openImagePath = function(importString){
            var imgPath;
            if (importString.indexOf('localImport') != -1) 
                imgPath = prompt("Please enter a local path to an image on disk.");
            else
                imgPath = prompt("Please enter a URL to an image.");
            var bShowError = false;
            if (imgPath != null){
                if (imgPath.indexOf('.png') == -1 && imgPath.indexOf('.jpeg') == -1 && imgPath.indexOf('.jpg') == -1){
                    bShowError = true;
                }
                else{
                    this.main.loadImageFile(imgPath);
                }
            }

            if (bShowError)
                alert('Not a valid image file.');
        };

        // determine if we want to process the texture from an image contained in an URL in here.
        this.openURLImage = new MenuItem(this.el, 'ge_sub_menu', 'Import Image URL...', (event) => {
            this.openImagePath('urlImport');
        });

        // Import an image as a texture from the local drive.
        // NOTE: Not supported in Chrome and Safari 11 and above (unless the developer option is turned on) 
        // since they have navitely possess CORS issues.
        this.openLocalImage = new MenuItem(this.el, 'ge_sub_menu', 'Import Local Image ...', (event) => {
            if (navigator.userAgent.indexOf('Chrome') != -1)
                alert('This feature is unavailable with this browser. Please use Firefox or another compatible browser. Thanks!');
            else
                this.openImagePath('localImport');
        });
    }
}
