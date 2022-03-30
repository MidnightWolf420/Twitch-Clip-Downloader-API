const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const app = express();
const port = 80;

async function sleep(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

app.use(bodyParser.json());
app.get(`/TTVClipDownloader`, async(req, res) => {
    if(req.query['clip'] || req.query['url']){
        res.setHeader('X-Powered-By', 'Twitch Clip Downloader');
        res.writeHead(200, {'Content-Type': 'text/html'});
        var html = fs.readFileSync('./index.html');
        clipUrl = req.query['clip'] || req.query['url'];
        if(clipUrl.startsWith('https://clips.twitch.tv/')){
            clipID = clipUrl.split('/').filter(e => Boolean(e))[clipUrl.split('/').filter(e => Boolean(e)).length - 1];
            const crawler = async() => {
                const browser = await puppeteer.launch({
                    headless: true
                });
                const page = await browser.newPage();
                await page.goto(`https://clips.twitch.tv/embed?autoplay=false&clip=${clipID}&parent=twitch.tv`);
                const vidEl = await page.$('#root');
                //streamer #root > div > div.Layout-sc-nxg1ff-0.video-player > div > div > div > div > div:nth-child(4) > div > div:nth-child(1) > div.Layout-sc-nxg1ff-0.jMIEhW.tw-card > div > div > div.Layout-sc-nxg1ff-0.jMIEhW.tw-card-body > div > p:nth-child(2) > a:nth-child(1)
                //clip name #root > div > div.Layout-sc-nxg1ff-0.video-player > div > div > div > div > div:nth-child(4) > div > div:nth-child(1) > div.Layout-sc-nxg1ff-0.jMIEhW.tw-card > div > div > div.Layout-sc-nxg1ff-0.jMIEhW.tw-card-body > div > p.CoreText-sc-cpl358-0.hzEbjO > a
                if (vidEl) {
                    await sleep(600)
                    //await sleep(1000);
                    const ttvhtml = await page.evaluate(element => element.outerHTML, vidEl);
                    //console.log(ttvhtml)
                    const clip = await page.evaluate(() => {
                        if(/"https:\/\/.+?&/.test(document.querySelector('#root > div > div.Layout-sc-nxg1ff-0.video-player > div > div > video').outerHTML)){
                            var data = {
                                "url": document.querySelector('#root > div > div.Layout-sc-nxg1ff-0.video-player > div > div > video').outerHTML.match(/"https:\/\/.+?"/)[0].replace(/"/g, ''),
                                "streamer": document.querySelector('#root > div > div.Layout-sc-nxg1ff-0.video-player > div > div > div > div > div:nth-child(4) > div > div:nth-child(1) > div.Layout-sc-nxg1ff-0.jMIEhW.tw-card > div > div > div.Layout-sc-nxg1ff-0.jMIEhW.tw-card-body > div > p:nth-child(2) > a:nth-child(1)').innerText,
                                "name": document.querySelector('#root > div > div.Layout-sc-nxg1ff-0.video-player > div > div > div > div > div:nth-child(4) > div > div:nth-child(1) > div.Layout-sc-nxg1ff-0.jMIEhW.tw-card > div > div > div.Layout-sc-nxg1ff-0.jMIEhW.tw-card-body > div > p.CoreText-sc-cpl358-0.hzEbjO > a').innerText,
                                "game": document.querySelector('#root > div > div.Layout-sc-nxg1ff-0.video-player > div > div > div > div > div:nth-child(4) > div > div:nth-child(1) > div.Layout-sc-nxg1ff-0.jMIEhW.tw-card > div > div > div.Layout-sc-nxg1ff-0.jMIEhW.tw-card-body > div > p:nth-child(2) > a:nth-child(2)').innerText
                            }
                            return data
                        } else return null
                    });
                    if(clip != null) {
                        var newHtml = html.toString().replace(/%URL%/gi, clip.url).replace(/%TITLE%/gi, `${clip.streamer} | ${clip.name}`)
                        res.end(newHtml);
                    } else  res.status(404).end("Not Found");
                }
                await page.close();
                await browser.close();
            }
            crawler()
        } else res.status(404).end("Not Found");
    } else res.status(404).end("Not Found");
});

app.listen(port, () => {
    console.log(`Listening on port`, port);
})
