const express = require('express');
const fetch = require('node-fetch');
const app = express();
const {URLSearchParams} = require('url');
const cors = require('cors');
const querystring = require('querystring');

var client_id = "df93ca1cd40a4311898d754798da9055";
var client_secret = "68d6353d4def44cbb560e8538f67d599";
var redirect_uri = "http://localhost:8080/callback";
var yt_api_key = "AIzaSyBziMVaKuSMQZL6aNOLltXdZKsWqg_Jz3Q";

app.use(cors());

app.get('/', (req, res) => {
    res.send("Hello World");
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
            };
            res.redirect(`http://localhost/Youtube-To-Spotify/#${querystring.stringify(sendBack)}`);
        });
    });
});

app.get('/convert', (req, res) => {
    const { playlist_id, user_id, access_token } = req.query;

    let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlist_id}&key=${yt_api_key}&access_token=${access_token}`;
    getSongNames(url).then(titles=>{
        const options = {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                name: "Test"
            })
        }
        let playlist_url = `https://api.spotify.com/v1/users/${user_id}/playlists`;
        fetch(playlist_url, options).then(result=>result.json()).then(result=>{
            getSpotUris(result.id, titles, access_token).then(()=>res.send());
        });
    });
});

async function getSpotUris(spot_id, titles, access_token) {
    let spot_playlist_url = `https://api.spotify.com/v1/playlists/${spot_id}/tracks`;

    while (titles.length > 0) {
        let toAdd = titles.slice(0, 100);
        titles = titles.slice(100);
        let spot_uris = [];     
        for (title of toAdd) {
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
                console.log(title);
            } else {
                spot_uris.push(res.tracks.items[0].uri);
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
        let data = await fetch (spot_playlist_url, options);
    }
}

async function getSongNames(mUrl) {
    let result = await fetch(mUrl);
    result = await result.json();
    let titles = [];
    for (item of result.items) {
        titles.push(item.snippet.title);
    }
    
    let nextPageToken = result.nextPageToken;
    if (nextPageToken) {
        if (mUrl.indexOf('nextPageToken') != -1) {
            const regex = /pageToken=(.*)/g;
            mUrl.replace(regex, nextPageToken);
        } else {
            const index = mUrl.indexOf('?')+1;
            mUrl = mUrl.slice(0, index) + `pageToken=${nextPageToken}&` + mUrl.slice(index);
        }
        const otherTitles = await getSongNames(mUrl);
        titles = [...titles, ...otherTitles];
    }
    return titles;
}

app.listen(8080);

