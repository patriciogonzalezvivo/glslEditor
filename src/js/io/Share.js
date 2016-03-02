'use strict';

var lastReplay; 

export function saveOnServer (ge, callback) {
    if (!ge.change && lastReplay) {
        callback(lastReplay);
        return
    }

    let content = ge.getContent();
    let name = ge.getAuthor();
    let title = ge.getTitle();

    if (name !== '' && title !== '') {
        name += '-' + title;
    }

    // STORE A COPY on SERVER
    let url = 'http://thebookofshaders.com:8080/';
    // let url = 'http://localhost:8080/';
    let data = new FormData();
    data.append('code', content);

    let dataURL = ge.shader.canvasDOM.toDataURL('image/png');
    let blobBin = atob(dataURL.split(',')[1]);
    let array = [];
    for (let i = 0; i < blobBin.length; i++) {
        array.push(blobBin.charCodeAt(i));
    }
    let file = new Blob([new Uint8Array(array)], { type: 'image/png' });
    data.append('image', file);

    let xhr = new XMLHttpRequest();
    xhr.open('POST', url + 'save', true);
    xhr.onload = (event) => {
        if (typeof callback === 'function') {
            let name = xhr.responseText;
            let replay = {
                    content: content,
                    name: name,
                    url: url
                };
            callback(replay);
            lastReplay = replay;
        }
    };
    xhr.send(data);
}

export function createOpenFrameArtwork(glslEditor, name, url, callback) {
    let title = glslEditor.getTitle();
    let author = glslEditor.getAuthor();
    let xhr = new XMLHttpRequest();
    callback = callback || () => {};
    // anywhere in the API that user {id} is needed, the alias 'current' can be used for the logged-in user
    xhr.open('POST', 'http://openframe.io:8888/api/users/current/owned_artwork', false);
    // set content type to JSON...
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    // This is essential in order to include auth cookies:
    xhr.withCredentials = true;
    xhr.onload = (event) => {
        if (event.currentTarget.status === 404) {
            let popup = window.open('http://openframe.io:8888/login-popup', 'login', 'width=500,height=600');
            let successListener = function(e) {
                if (e.data === 'success') {
                    createOpenFrameArtwork(glslEditor, name, url, callback);
                }
                window.removeEventListener('message', successListener);
            }
            window.addEventListener('message', successListener, false);
        } else if (event.currentTarget.status === 200) {
            callback(true);
        } else {
            callback(false);
        }
    };
    xhr.onerror = (event) => {
        console.log(event.currentTarget.status);
    };
    xhr.send(JSON.stringify({
        title: title,
        author_name: author,
        format: 'openframe-glslviewer',
        url: 'http://thebookofshaders.com/log/' + name + '.frag',
        thumb_url: 'http://thebookofshaders.com/log/' + name + '.png'
    }));
}
