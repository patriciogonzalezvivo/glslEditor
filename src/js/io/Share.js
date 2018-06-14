var lastReplay;

export function saveOnServer (ge, callback) {
    if (!ge.change && lastReplay) {
        callback(lastReplay);
        return;
    }

    let content = ge.getContent();
    let name = ge.getAuthor();
    let title = ge.getTitle();

    if (name !== '' && title !== '') {
        name += '-' + title;
    }

    // STORE A COPY on SERVER
    let url = 'https://thebookofshaders.com:8080/';
    // let url = 'http://localhost:8080/';
    let data = new FormData();
    data.append('code', content);

    let dataURL = ge.shader.elCanvas.toDataURL('image/png');
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
    const OF_BASE_API_URL = 'https://api.openframe.io/v0';
    const OF_BASE_APP_URL = 'https://openframe.io';
    // const OF_BASE_API_URL = 'http://localhost:8888/api'; // for local testing
    // const OF_BASE_APP_URL = 'http://localhost:8000'; // for local testing
    let title = glslEditor.getTitle();
    let author = glslEditor.getAuthor();
    glslEditor.getOfToken().then(initiateOfRequest);

    function initiateOfRequest(ofToken) {
        let xhr = new XMLHttpRequest();
        if (typeof callback === 'undefined') {
            callback = () => {};
        }
        // anywhere in the API that user {id} is needed, the alias 'current' can be used for the logged-in user
        xhr.open('POST', `${OF_BASE_API_URL}/users/current/created_artwork`);
        // set content type to JSON...
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhr.setRequestHeader('Authorization', ofToken);
        xhr.setRequestHeader('access_token', ofToken);

        // This is essential in order to include auth cookies:
        xhr.onload = (event) => {
            console.log('onload', event);
            if (event.currentTarget.status >= 400) {
                window.open(`${OF_BASE_APP_URL}/login`, 'login', 'width=500,height=600');
                let successListener = function(e) {
                    if (e.data === 'success') {
                        createOpenFrameArtwork(glslEditor, name, url, callback);
                    }
                    window.removeEventListener('message', successListener);
                };
                window.addEventListener('message', successListener, false);
            }
            else if (event.currentTarget.status === 200) {
                callback(true);
            }
            else {
                callback(false);
            }
        };
        xhr.onerror = (event) => {
            console.log('Status:',event.currentTarget.status);
        };
        /* Remote expects underscore keys */
        /* eslint-disable camelcase */
        xhr.send(JSON.stringify({
            title: title,
            author_name: author,
            is_public: false,
            format: 'openframe-glslviewer',
            url: 'https://thebookofshaders.com/log/' + name + '.frag',
            thumb_url: 'https://thebookofshaders.com/log/' + name + '.png'
        /* eslint-enable camelcase */
        }));
    }
}
