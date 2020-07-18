const express = require('express');
const fetch = require('node-fetch');
const app = express();
const {URLSearchParams} = require('url');
const cors = require('cors');
const querystring = require('querystring');
const redirect_uri = process.env.CLIENT_ID ? 'https://youtube-spotify-converter.herokuapp.com/callback': "http://localhost:8080/callback";
let client_id = process.env.CLIENT_ID;
let client_secret = process.env.CLIENT_SECRET;
let yt_api_key = process.env.YT_API_KEY;

if (!(client_id && client_secret && yt_api_key)) {
    const env = require('./credentials').env;
    client_id = env.client_id;
    client_secret = env.client_secret;
    yt_api_key = env.yt_api_key;
}

app.use(express.static(__dirname + "/static"));

app.use(cors());

app.get("/", (_, res) => {
    res.sendFile(__dirname + "/static/index.html");
});

app.get("/credentials", (req, res) => {
    res.send(JSON.stringify({client_id: client_id, redirect_uri: redirect_uri}));
});

app.get('/callback', (req, res) => {
    const params = new URLSearchParams();
    const body = {
        grant_type: "authorization_code",
        code: req.query.code,
        redirect_uri: redirect_uri,
        client_id: client_id,
        client_secret: client_secret
    };
    for (key in body) {
        params.append(key, body[key]);
    }
    const options = {
        method: "POST",
        headers: {
            'Content-type': 'application/x-www-form-urlencoded'
        },
        body: params
    };
    fetch(`https://accounts.spotify.com/api/token`, options).then(result=>{ 
        return result.json();
    }).then(result=>{
        fetch(`https://api.spotify.com/v1/me`, {headers: {'Authorization': `Bearer ${result.access_token}`}}).then(data=>data.json()).then(data=>{
            const sendBack = {
                access_token: result.access_token,
                refresh_token: result.refresh_token,
                id: data.id,
                name: data.display_name
            };
            res.redirect(`/#${querystring.stringify(sendBack)}`);
        });
    });
});

app.get('/convert', (req, res) => {
    let { playlist_name, playlist_id, user_id, access_token, refresh_token } = req.query;
    refresh(refresh_token).then(access_token => {
        let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlist_id}&key=${yt_api_key}&access_token=${access_token}`;
        getSongNames(url)
            .then(titles=>{
                const options = {
                    method: "POST",
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: playlist_name
                    })
                };
                let playlist_url = `https://api.spotify.com/v1/users/${user_id}/playlists`;
                fetch(playlist_url, options).then(result=>result.json())
                    .then(result=>{
                        getSpotUris(result.id, titles, access_token)
                            .then((unmatched)=>res.send(JSON.stringify(unmatched)));
                    });
            })
            .catch(() => {
                res.send(JSON.stringify({error: "bad yt api"}));
            });
    });
});

async function refresh(refreshToken) {
    const obj = {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: client_id,
        client_secret: client_secret
    }
    let params = new URLSearchParams();
    for (let key in obj) {
        params.append(key, obj[key]);
    }
    const options = {
        method: "POST",
        body: params,
        headers: {
            'Content-type': 'application/x-www-form-urlencoded'
        }
    }
    let res = await fetch("https://accounts.spotify.com/api/token", options);
    res = await res.json();
    return res.access_token;
}

app.get('/test', () => {
    const playlist_id = "PL1CEzmuWnTyPHhnt7cv1seqJG7FkyMHty";
    const user_id = "21eo3yi6y2e2cbrcsdwgnfkfq";
    const access_token = "BQBAvaIKpFaacC3YEqnGTg_OGSIdCeE4jxQwQUTlg11Bj16qDuSqDQLdaNhHI4-XMBLTES1EiqD8R0gKLcbXxb48uKCBFstwk9RPYRcz4mMgnj_a3DFbqWK8wHgrIKkRMhU_41OI9zwc9w_iAdhTqroS5CxR3L3chNK76jeHVXc-8ov_TRImLus9Sm1p84Wj4GkIc02-HpG8ilpV4Gfmu9fI5Ak6E5Y";

    let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlist_id}&key=${yt_api_key}&access_token=${access_token}`;
        const options = {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                name: "Test"
            })
        };
        let playlist_url = `https://api.spotify.com/v1/users/${user_id}/playlists`;
        fetch(playlist_url, options).then(result=>result.json()).then(result=>{
            getSpotUris(result.id, ["Dreamgirl"], access_token);
        });
});

async function getSpotUris(spot_id, titles, access_token) {
    let spot_playlist_url = `https://api.spotify.com/v1/playlists/${spot_id}/tracks`;

    let unmatched = [];

    while (titles.length > 0) {
        let toAdd = titles.slice(0, 100);
        titles = titles.slice(100);
        let spot_uris = [];     
        for (let title of toAdd) {
            title = encodeURIComponent(title);
            let search_url = `https://api.spotify.com/v1/search?q="${title}"&type=track&limit=1`;
            let options = {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            }
            let res = await fetch(search_url, options);
            res = await res.json();
            if (!res.tracks || !res.tracks.items[0]) {
                unmatched.push(title);
            } else {
                let mostPopular = res.tracks.items.reduce((prev, curr) => (curr.popularity > prev.popularity) ? curr : prev);
                spot_uris.push(mostPopular.uri);
            }
        }
        let options = {
            headers: {
                'Content-type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            },
            method: "POST",
            body: JSON.stringify({uris: spot_uris})
        }
        await fetch (spot_playlist_url, options);
        return unmatched;
    }
}

async function getSongNames(mUrl) {
    let result = await fetch(mUrl);
    result = await result.json();
    let titles = [];

    if (!result.items) throw new Error("Error with Youtube API");

    for (const item of result.items) {
        titles.push(item.snippet.title);
    }
    
    let nextPageToken = result.nextPageToken;
    if (nextPageToken) {
        if (mUrl.indexOf('pageToken') != -1) {
            const regex = /pageToken=.*?&/g;
            mUrl = mUrl.replace(regex, `pageToken=${nextPageToken}&`);
        } else {
            const index = mUrl.indexOf('?')+1;
            mUrl = mUrl.slice(0, index) + `pageToken=${nextPageToken}&` + mUrl.slice(index);
        }
        const otherTitles = await getSongNames(mUrl);
        titles = [...titles, ...otherTitles];
    }
    return titles;
}

app.listen(process.env.PORT || 8080);