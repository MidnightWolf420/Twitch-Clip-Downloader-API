const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = 80;

async function getURL(clientid, twitchClipId, sha256Hash = '6e465bb8446e2391644cf079851c0cb1b96928435a240f07ed4b240f0acc6f1b') {
    var urlEndpoint = "https://gql.twitch.tv/gql";
    return new Promise((success, failure) => {
        this.id = twitchClipId;

        const data = [{
            operationName: "ClipsDownloadButton",
            variables: {
                slug: this.id,
            },
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash: sha256Hash,
                }
            },
        }];

        axios.post(urlEndpoint, data, {
                headers: {
                    "Client-Id": clientid,
                }
            }).then((responseEndpoint) => {

                const response = responseEndpoint.data;

                if (response.error || response.errors) {
                    return failure(response.message);
                }

                const responseData = response[0];

                if (responseData.errors) {
                    return failure('Error in twitch response');
                }

                let url = '';

                try {
                    const playbackAccessToken = responseData.data.clip.playbackAccessToken;
                    url = responseData.data.clip.videoQualities[0].sourceURL + '?sig=' + playbackAccessToken.signature + '&token=' + encodeURIComponent(playbackAccessToken.value);
                } catch (err) {
                    return failure('Error in parse video response');
                }

                if (url === '') {
                    return failure('Error for obtain url of clip');
                }

                success(url);

            }).catch((responseError) => {
                failure(responseError);
            });
    });
}

app.use(bodyParser.json());
app.get(``, async(req, res) => {
    if(req.query['clip'] || req.query['url']){
        res.setHeader('X-Powered-By', 'Twitch Clip Downloader');
        res.writeHead(200, {'Content-Type': 'text/html'});
        var html = fs.readFileSync('./index.html');
        var clipUrl = req.query['clip'] || req.query['url'];
        if(clipUrl.startsWith('https://clips.twitch.tv/')){
            clipID = clipUrl.split('/').filter(e => Boolean(e))[clipUrl.split('/').filter(e => Boolean(e)).length - 1];
            var result = await axios.get("https://twitch.tv");
            if(/clientId=".+?"/.test(result.data)){
                var clientId = result.data.match(/clientId=".+?"/)[0].replace(/((clientId=")|")/gi, '')
                var dlURL = await getURL(clientId, clipID);
                var newHtml = html.toString().replace(/%URL%/gi, dlURL).replace(/%TITLE%/gi, `Twitch Clips Downloader`)
                res.end(newHtml);
            } else res.status(404).end("Not Found");
        } else res.status(400).end("Please Provide A Twitch Clip With ?url=<Twitch Clip URL>");
    } else res.status(400).end("Please Provide A Twitch Clip With ?url=<Twitch Clip URL>");
});

app.listen(port, () => {
    console.log(`Listening on port`, port);
})
