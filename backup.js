'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');
const co = require('co');
const util = require('util');
const thunkify = require('thunkify');
const _request = require('request');
const request = thunkify(_request);
const mkdir = thunkify(fs.mkdir);
const unlink = thunkify(fs.unlink);
const readFile = thunkify(fs.readFile);
const writeFile = thunkify(fs.writeFile);
const cheerio = require('cheerio');

co(function*(){
    let albumUriList = (yield readFile(path.resolve(__dirname, 'albums.txt'), {encoding: 'utf8'}))
        .split(/\n/g).map((uri) => uri.trim()).filter((uri) => uri.length > 0);
    console.log(`Found albums in queue:\t${albumUriList.length}`);
    let albumPhotosList = new Array(albumUriList.length);
    let progressPath = path.resolve(__dirname, 'out', 'progress.json');
    let progressList = [];
    if(yield exists(progressPath)){
        progressList = JSON.parse(yield readFile(progressPath, {encoding:'utf8'}));
    }
    let fetchedPhotos = 0, totalPhotos = 0;
    for(let ai = 0, al = albumUriList.length; ai < al; ai++){
        let albumUri = albumUriList[ai];
        logp(`Trying to load album info <${albumUri}>: `);
        albumPhotosList[ai] = yield loadPhotoList(albumUri);
        totalPhotos += albumPhotosList[ai].length;
        console.log(`    [√]  found photos: ${albumPhotosList[ai].length}`);
        yield sleep(500);
    }
    console.log(`Total photos found:\t${totalPhotos}`);
    totalPhotos -= progressList.length;
    console.log(`Total photos to load:\t${totalPhotos}`);
    let tsStart = Date.now();
    try {
        for (let ai = 0, al = albumUriList.length; ai < al; ai++) {
            let albumUri = albumUriList[ai];
            let albumName = getAlbumName(albumUri);
            let albumPath = path.resolve(__dirname, 'out', albumName);
            if (!(yield exists(albumPath))) {
                yield mkdir(albumPath);
            }
            console.log(`Fetching album:\t${albumName}`);
            for (let pi = 0, pl = albumPhotosList[ai].length; pi < pl; pi++) {
                let photoRelUri = albumPhotosList[ai][pi];
                if (progressList.indexOf(photoRelUri) != -1) {
                    continue;
                }
                let photoUri = `http://vk.com${photoRelUri}`;
                console.log(`    Trying to load photo [${pi+1}/${pl}] <${photoUri}>: `);
                let timeElapsed = Math.round(
                    ((Date.now() - tsStart) / fetchedPhotos) *
                    (totalPhotos - fetchedPhotos) / (60 * 1000)
                );
                logr(`Photos fetched: ${fetchedPhotos} of ${totalPhotos}    Time elapsed: ${timeElapsed}m`);
                let photoName, errors = 0;
                yield (function* reload(){
                    try {
                        let photoDirectUri = yield loadPhotoDirectUri(photoUri, albumUri);
                        photoName = getPhotoName(photoUri, photoDirectUri);
                        let photoLocalPath = path.resolve(albumPath, photoName);
                        yield fetchPhoto(photoDirectUri, photoLocalPath, photoUri);
                    }
                    catch(e){
                        if(++errors > 3){
                            throw new Error(`Too many errors:\n${e.stack}`);
                        }
                        else {
                            yield reload();
                        }
                    }
                })();
                fetchedPhotos++;
                progressList.push(photoRelUri);
                console.log(`        [√]  ${photoName}`);
                timeElapsed = Math.round(
                    ((Date.now() - tsStart) / fetchedPhotos) *
                    (totalPhotos - fetchedPhotos) / (60 * 1000)
                );
                logr(`Photos fetched: ${fetchedPhotos} of ${totalPhotos}    Time elapsed: ${timeElapsed}m`);
                yield sleep(Math.round(500 * Math.random()) + 500);
            }
        }
    }
    catch(e){
        yield writeFile(progressPath, JSON.stringify(progressList, null, 4));
        console.error(e.stack);
        throw e;
    }
    let tsEnd = Date.now();
    let tsEndStr = '' + (new Date(tsEnd));
    if(yield exists(progressPath)){
        yield unlink(progressPath);
    }
    console.log(`Job finished at ${tsEndStr}`);
});

function* loadPhotoList(albumUri){
    let photosUris = [];

    let albumPage = yield request({
        url: albumUri,
        method: 'GET',
        gzip: true,
        jar: true,
        //forever: true,
        timeout: 30 * 1000,
        headers: {
            'Connection': 'close',
            'User-Agent': 'Mozilla/5.0 (compatible; YandexImages/3.0; +http://yandex.com/bots)'
        }
    });

    if(albumPage[0].statusCode != 200) {
        throw new Error(`Unable to load album: ${albumUri}`);
    }

    logp('.');

    let $ = cheerio.load(albumPage[1]);

    $('div.summary > *').remove();
    let photoCnt = parseInt($('div.summary').text().replace(/\D/g, ''));

    $('div.photo_row a').each((i, a) => photosUris.push($(a).attr('href')));

    if(photoCnt > 40){
        cheerio.load(JSON.parse(albumPage[1].match(/^var preload = (.*);$/m)[1])[1])
            ('div.photo_row a')
                .each((i, a) => photosUris.push($(a).attr('href')));
    }

    if(photoCnt > 80){

        while(photosUris.length < photoCnt){

            yield sleep(500);

            let albumAjax = yield request({
                url: albumUri,
                method: 'POST',
                form: {al: 1, part: 1, offset: photosUris.length},
                gzip: true,
                jar: true,
                //forever: true,
                timeout: 30 * 1000,
                headers: {
                    'Connection': 'close',
                    'User-Agent': 'Mozilla/5.0 (compatible; YandexImages/3.0; +http://yandex.com/bots)',
                    'Referer': albumUri
                }
            });

            if(albumAjax[0].statusCode != 200) {
                throw new Error(`Unable to load album: ${albumUri}`);
            }

            logp('.');

            cheerio.load(albumAjax[1].split(/<!>/g)[6])
                ('div.photo_row a')
                    .each((i, a) => photosUris.push($(a).attr('href')));

        }

    }

    logp('\n');

    return photosUris;
}

function* loadPhotoDirectUri(photoUri, refUri){
    let photoPage = yield request({
        url: photoUri,
        method: 'GET',
        gzip: true,
        jar: true,
        //forever: true,
        timeout: 30 * 1000,
        headers: {
            'Connection': 'close',
            'User-Agent': 'Mozilla/5.0 (compatible; YandexImages/3.0; +http://yandex.com/bots)',
            'Referer': refUri
        }
    });

    if(photoPage[0].statusCode != 200) {
        throw new Error(`Unable to load photo: ${photoUri}`);
    }

    let preload = photoPage[1].match(/^ajax\.preload\('al_photos.php', (\{[^}]*}), (\[.*])\);$/m);
    let action = JSON.parse(preload[1]);
    let album = JSON.parse(preload[2]);
    let directPhotoUri = null;
    for(let photo of album[3]) {
        if(action.photo == photo.id) {
            directPhotoUri =
                'y_src' in photo ?
                    photo['y_src'] :
                    'x_src' in photo ?
                        photo['x_src'] :
                        'r_src' in photo ?
                            photo['r_src'] :
                            'q_src' in photo ?
                                photo['q_src'] :
                                'p_src' in photo ?
                                    photo['p_src'] :
                                    'o_src' in photo ?
                                        photo['o_src'] :
                                        null;
            break;
        }
    }
    return directPhotoUri;
}

function fetchPhoto(photoDirectUri, photoLocalPath, refUri){
    return (cb) => {
        let remoteStream = _request({
            url: photoDirectUri,
            method: 'GET',
            jar: true,
            gzip: true,
            //forever: true,
            timeout: 30 * 1000,
            headers: {
                'Connection': 'close',
                'User-Agent': 'Mozilla/5.0 (compatible; YandexImages/3.0; +http://yandex.com/bots)',
                'Referer': refUri
            }
        });
        remoteStream.on('error', (err) => cb(err));
        remoteStream.on('end', () => cb());
        let localStream = fs.createWriteStream(photoLocalPath);
        remoteStream.pipe(localStream);
    }
}

function getAlbumName(albumUri){
    return url.parse(albumUri).pathname.replace(/^[/]/, '');
}

function getPhotoName(photoUri, photoDirectUri){
    return url.parse(photoUri).pathname.replace(/^[/]/, '') + photoDirectUri.match(/\.[\w\d]+$/)[0];
}

function logp(msg){
    process.stdout.write(`${msg}`, 'utf8');
}

function logr(msg){
    process.stdout.write(`${msg}\r`, 'utf8');
}

function sleep(ms){
    return (cb) => setTimeout(() => cb(), ms);
}

function exists(p) {
    return (cb) => fs.exists(p, e => cb(null, e));
}

