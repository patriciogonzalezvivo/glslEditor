'use strict';

export default class HashWatch {
    constructor (main) {
        this.main = main;
        this.check();

        window.addEventListener('hashchange', () => {
            this.check();
        }, false);
    }

    check() {
        if (window.location.hash !== '') {
            this.main.options.imgs = [];

            let hashes = location.hash.split('&');
            for (let i in hashes) {
                let ext = hashes[i].substr(hashes[i].lastIndexOf('.') + 1);
                let filename = hashes[i];

                // Extract hash if is present
                if (filename.search('#') === 0) {
                    filename = filename.substr(1);
                }

                if (ext === 'frag') {
                    this.main.open(filename);
                }
                else if (ext === 'png' || ext === 'jpg' || ext === 'PNG' || ext === 'JPG') {
                    this.main.options.imgs.push(filename);
                }
            }
        }

        let query = parseQuery(window.location.search.slice(1));
        if (query) {
            if (query.log) {
                this.main.open('http://thebookofshaders.com:8080/data/' + query.log + '.frag');
            }
        }
    }
}

function parseQuery (qstr) {
    let query = {};
    let a = qstr.split('&');
    for (let i in a) {
        let b = a[i].split('=');
        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
    }
    return query;
}
