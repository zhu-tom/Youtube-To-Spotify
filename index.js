window.addEventListener("DOMContentLoaded", ()=>{
    var client_id, redirect_uri;
    fetch("http://localhost:8080/credentials").then(res=>res.json()).then(res=>{
        redirect_uri = res.redirect_uri;
        client_id = res.client_id;
    });

    let hash = window.location.hash.slice(1);
    let data = {}
    for (group of hash.split("&")) {
        const result = group.split("=");
        window.sessionStorage.setItem(result[0], result[1]);
    }

    console.log(window.sessionStorage);

    document.querySelector("#login").addEventListener("click", ()=>{
        window.location.href = `https://accounts.spotify.com/en/authorize?client_id=${client_id}&scope=playlist-modify-public playlist-modify-private&response_type=code&redirect_uri=${redirect_uri}`;
    });
    document.querySelector("#convert").addEventListener("click", ()=>{
        const regex = /list=(.*)&*/gi;
        const url = document.querySelector("#playlist_url").value;
        const playlistId = regex.exec(url)[1];
        if (playlistId) {
            fetch(`http://localhost:8080/convert?playlist_id=${playlistId}&user_id=${window.sessionStorage.getItem('id')}&access_token=${window.sessionStorage.getItem('access_token')}`).then(res => console.log(res));
        }
    });
    document.querySelector('#test').addEventListener('click', ()=>{
        fetch("http://localhost:8080/test");
    });
});