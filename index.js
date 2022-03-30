const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = 80;

app.use(bodyParser.json());
app.get(`/TTVClipDownloader`, async(req, res) => {
    if(req.query['clip'] || req.query['url']){
        res.setHeader('X-Powered-By', 'Twitch Clip Downloader');
        res.writeHead(200, {'Content-Type': 'text/html'});
        var html = fs.readFileSync('./index.html.txt');
        clipUrl = req.query['clip'] || req.query['url'];
        if(clipUrl.startsWith('https://clips.twitch.tv/')){
            clipID = clipUrl.split('/').filter(e => Boolean(e))[clipUrl.split('/').filter(e => Boolean(e)).length - 1];
            axios.get(clipUrl).then(result => {
                if(result.status === 200){
                    if(/"thumbnailUrl":\[.+?\]/g.test(result.data)){
                        var thumbnail = result.data.match(/"thumbnailUrl":\[.+?\]/g)[0].replace(/(("thumbnailUrl":)|\[|\]|")/g, '').split(',')[0]
                        var file = thumbnail.replace(/-preview-.+?x.+?.jpg/, '.mp4').substring(thumbnail.replace('-social-preview.jpg', '.mp4').lastIndexOf('/') + 1);    
                        var newHtml = html.toString().replace(/%URL%/gi, `https://production.assets.clips.twitchcdn.net/${file}?sig=26a6ec5642e5bb5c831c9ab26a9a65d2a5f8800f&token=%7B%22authorization%22%3A%7B%22forbidden%22%3Afalse%2C%22reason%22%3A%22%22%7D%2C%22clip_uri%22%3A%22%22%2C%22device_id%22%3Anull%2C%22expires%22%3A1648592590%2C%22user_id%22%3A%22%22%2C%22version%22%3A2%7D`).replace(/%TITLE%/gi, `Twitch Clip Downloader`)
                        res.end(newHtml);
                    } else console.log("Can't Find Thumbnail")
                } else console.log(result.status)
            }).catch((err) => console.error(err));
        } else res.status(404).end("Not Found");
    } else res.status(404).end("Not Found");
});

app.listen(port, () => {
    console.log(`Listening on port`, port);
})
