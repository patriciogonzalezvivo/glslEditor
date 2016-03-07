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
                let path = hashes[i];

                // Extract hash if is present
                if (path.search('#') === 0) {
                    path = path.substr(1);
                }

                let filename = path.split('/').pop();

                if (ext === 'frag') {
                    this.main.open(path, filename.replace(/\.[^/.]+$/, ''));
                }
                else if (ext === 'png' || ext === 'jpg' || ext === 'PNG' || ext === 'JPG') {
                    this.main.options.imgs.push(path);
                }
            }
        }

        let query = parseQuery(window.location.search.slice(1));
        if (query) {
            if (query.log) {
                if (this.main.bufferManager) {
                    let logs = query.log.split(',');
                    for (let i in logs) {
                        this.main.open('http://thebookofshaders.com/log/' + logs[i] + '.frag', logs[i]);
                    }
                }
                else {
                    this.main.open('http://thebookofshaders.com/log/' + query.log + '.frag', query.log);
                }
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
