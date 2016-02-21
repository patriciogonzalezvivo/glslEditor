export function saveOnServer (ge, callback) {
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

    let dataURL = ge.shader.canvasDOM.toDataURL("image/png");
    let blobBin = atob(dataURL.split(',')[1]);
    let array = [];
    for (let i = 0; i < blobBin.length; i++) {
        array.push(blobBin.charCodeAt(i));
    }
    let file = new Blob([new Uint8Array(array)], {type: 'image/png'});
    data.append("image", file);

    let xhr = new XMLHttpRequest();
    xhr.open('POST', url+'save', true);
    xhr.onload = (event) => {
        if (typeof callback === 'function') {
            let name = xhr.responseText;
            
            createOpenFrameArtwork(ge, name, url);

            callback({  content: content,
                        name: name,
                        url: url
                    });
        }
    };
    xhr.send(data);
}

function createOpenFrameArtwork(glslEditor, name, url) {
    let title = glslEditor.getTitle();
    let author_name = glslEditor.getAuthor();
    
    if (title === '' || author_name === '') {
        return;
    }

    // let id = '56c5e50de860aa062caac935'; // The book of Shader ID
    let xhr = new XMLHttpRequest();
    // anywhere in the API that user {id} is needed, the alias 'current' can be used for the logged-in user
    xhr.open('POST', 'http://openframe.io:8888/api/users/current/collections/primary/artwork', true);
    // xhr.open('POST', 'http://openframe.io:8888/api/users/'+id+'/collections/primary/artwork', true);
    // set content type to JSON...
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    // This is essential in order to include auth cookies:
    xhr.withCredentials = true;
    xhr.onload = (event) => {
        console.log(event);
    };
    xhr.onerror = (event) => {
        console.log(event);
    };
    xhr.send(JSON.stringify({
        'title': title,
        'author_name': author_name,
        'format': 'openframe-glslviewer',
        'url': url+'data/'+name+'.frag',
        'thumb_url': url+'data/'+name+'.png'
    }));
}