var client_id = "df93ca1cd40a4311898d754798da9055";
var redirect_uri = "http://localhost:8080/callback";

window.addEventListener("DOMContentLoaded", ()=>{
    let hash = window.location.hash.slice(1);
    let data = {}
    for (group of hash.split("&")) {
        const result = group.split("=");
        window.sessionStorage.setItem(result[0], result[1]);
    }

    document.querySelector("#login").addEventListener("click", ()=>{
        window.location.href = `https://accounts.spotify.com/en/authorize?client_id=${client_id}&scope=playlist-modify-public playlist-modify-private&response_type=code&redirect_uri=${redirect_uri}`
    });
    document.querySelector("#convert").addEventListener("click", ()=>{
        const regex = /list=(.*)&*/gi;
        const url = document.querySelector("#playlist_url").value;
        const playlistId = regex.exec(url)[1];
        if (playlistId) {
            fetch(`http://localhost:8080/convert?playlist_id=${playlistId}&user_id=${window.sessionStorage.getItem('id')}&access_token=${window.sessionStorage.getItem('access_token')}`).then();
        }
    });
    document.querySelector('#test').addEventListener('click', ()=>{
        let title = "Bon Iver Can't Make You Love Me";
        title = title.replace(' ', '+');
        let search_url = `https://api.spotify.com/v1/search?q=${title}&type=track&limit=1`;
        let options = {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`
            }
        }
        fetch(search_url, options).then(res=>{console.log(res);return res.json();}).then(res=>console.log(res.tracks.items[0]));
    });
});