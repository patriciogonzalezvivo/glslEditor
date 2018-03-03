/* global MediaRecorder 
Author: Brett Camper (@professorlemeza)
URL: https://github.com/tangrams/tangram/blob/master/src/utils/media_capture.js
*/
import {createObjectURL} from './urls';

export default class MediaCapture {

    constructor() {
        this.queue_screenshot = null;
        this.video_capture = null;
    }

    setCanvas (canvas) {
        this.canvas = canvas;
    }

    // Take a screenshot, returns a promise that resolves with the screenshot data when available
    screenshot () {
        if (this.queue_screenshot != null) {
            return this.queue_screenshot.promise; // only capture one screenshot at a time
        }

        // Will resolve once rendering is complete and render buffer is captured
        this.queue_screenshot = {};
        this.queue_screenshot.promise = new Promise((resolve, reject) => {
            this.queue_screenshot.resolve = resolve;
            this.queue_screenshot.reject = reject;
        });
        return this.queue_screenshot.promise;
    }

    // Called after rendering, captures render buffer and resolves promise with the image data
    completeScreenshot () {
        if (this.queue_screenshot != null) {
            // Get data URL, convert to blob
            // Strip host/mimetype/etc., convert base64 to binary without UTF-8 mangling
            // Adapted from: https://gist.github.com/unconed/4370822
            const url = this.canvas.toDataURL('image/png');
            const data = atob(url.slice(22));
            const buffer = new Uint8Array(data.length);
            for (let i = 0; i < data.length; ++i) {
                buffer[i] = data.charCodeAt(i);
            }
            const blob = new Blob([buffer], { type: 'image/png' });

            // Resolve with screenshot data
            this.queue_screenshot.resolve({ url, blob, type: 'png' });
            this.queue_screenshot = null;
        }
    }

    // Starts capturing a video stream from the canvas
    startVideoCapture () {
        if (typeof window.MediaRecorder !== 'function' || !this.canvas || typeof this.canvas.captureStream !== 'function') {
            console.log('warn: Video capture (Canvas.captureStream and/or MediaRecorder APIs) not supported by browser');
            return false;
        }
        else if (this.video_capture) {
            console.log('warn: Video capture already in progress, call Scene.stopVideoCapture() first');
            return false;
        }

        // Start a new capture
        try {
            let cap = this.video_capture = {};
            cap.chunks = [];
            cap.stream = this.canvas.captureStream();
            cap.options = { mimeType: 'video/webm' }; // TODO: support other format options
            cap.media_recorder = new MediaRecorder(cap.stream, cap.options);
            cap.media_recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                   cap.chunks.push(event.data);
                }

                // Stopped recording? Create the final capture file blob
                if (cap.resolve) {
                    let blob = new Blob(cap.chunks, { type: cap.options.mimeType });
                    let url = createObjectURL(blob);

                    // Explicitly remove all stream tracks, and set objects to null
                    if (cap.stream) {
                        let tracks = cap.stream.getTracks() || [];
                        tracks.forEach(track => {
                            track.stop();
                            cap.stream.removeTrack(track);
                        });
                    }
                    cap.stream = null;
                    cap.media_recorder = null;
                    this.video_capture = null;

                    cap.resolve({ url, blob, type: 'webm' });
                }
            };
            cap.media_recorder.start();
        }
        catch (e) {
            this.video_capture = null;
            console.log('error: Scene video capture failed', e);
            return false;
        }
        return true;
    }

    // Stops capturing a video stream from the canvas, returns a promise that resolves with the video when available
    stopVideoCapture () {
        if (!this.video_capture) {
            console.log('warn: No scene video capture in progress, call Scene.startVideoCapture() first');
            return Promise.resolve({});
        }

        // Promise that will resolve when final stream is available
        this.video_capture.promise = new Promise((resolve, reject) => {
            this.video_capture.resolve = resolve;
            this.video_capture.reject = reject;
        });

        // Stop recording
        this.video_capture.media_recorder.stop();

        return this.video_capture.promise;
    }

}