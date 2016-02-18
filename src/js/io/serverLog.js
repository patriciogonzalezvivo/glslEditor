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
    // let data = new FormData();
    // // data.append('title',glslEditor.getTitle());
    // // data.append('author_name',glslEditor.getAuthor());
    // // data.append('format', 'openframe-glslviewer');
    // // data.append('url', url+'data/'+name+'.frag');
    // // data.append('thumb_url', url+'data/'+name+'.png');

    // data.append('body',{
    //         title: glslEditor.getTitle(),
    //         author_name: glslEditor.getAuthor(),
    //         format: 'openframe-glslviewer',
    //         url: url+'data/'+name+'.frag',
    //         thumb_url: url+'data/'+name+'.png'
    //     });

    // data.append('user', { id: '56c5e50de860aa062caac935', username: 'thebookofshaders'});
    
    // let xhr = new XMLHttpRequest();
    // xhr.open('POST', 'http://openframe.io:8888/add-artwork', true);
    // xhr.onload = (event) => {
    //     console.log(event);
    // };
    // xhr.send(data);
}