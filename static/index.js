window.addEventListener("DOMContentLoaded", ()=>{
    var client_id, redirect_uri;
    fetch("/credentials").then(res=>res.json()).then(res=>{
        redirect_uri = res.redirect_uri;
        client_id = res.client_id;
    });

    let hash = window.location.hash.slice(1);
    for (group of hash.split("&")) {
        const result = group.split("=");
        window.sessionStorage.setItem(result[0], result[1]);
    }

    if (window.sessionStorage.getItem("refresh_token") && window.sessionStorage.getItem("access_token") && window.sessionStorage.getItem("id")) {
        document.querySelector("#inputs").style.display = "flex";
        document.querySelector("#changeAccount").style.display = "flex";
        document.querySelector("#currUser").innerHTML = `Currently logged in as: ${decodeURIComponent(window.sessionStorage.getItem("name"))}`;
    } else {
        document.querySelector("#login").style.display = "flex";
    }

    document.querySelector("#changeAccount").addEventListener('click', () => {
        window.sessionStorage.clear();
        window.location.href = "./index.html";
    });

    document.querySelector("#login").addEventListener("click", ()=>{
        window.location.href = `https://accounts.spotify.com/en/authorize?client_id=${client_id}&scope=playlist-modify-public playlist-modify-private&response_type=code&redirect_uri=${redirect_uri}&show_dialog=true`;
    });

    const closeModal = (modal) => {
        modal.classList.remove("is-active");
    }

    for (let modal of document.querySelectorAll('.modal')) {
        modal.querySelector('.delete').addEventListener('click', () => closeModal(modal));
        modal.querySelector('.modal-background').addEventListener('click', () => closeModal(modal));
    }

    document.querySelector("#convert").addEventListener("click", ()=>{
        const regex = /list=(.*)&*/gi;
        let pIdInput = document.querySelector("#playlist_url")
        const url = pIdInput.value;
        let playlistId = regex.exec(url);
        playlistId = playlistId ? playlistId[1] : undefined;
        let pNameInput = document.querySelector("#playlist_name");
        const playlistName = pNameInput.value.trim();

        pIdInput.classList.remove("is-danger");
        pNameInput.classList.remove("is-danger");

        let err = false;
        if (!playlistId) {
            pIdInput.classList.add("is-danger");
            err = true;
        }
        if (!playlistName) {
            pNameInput.classList.add("is-danger");
            err = true;
        }

        if (!err) {
            const btn = document.querySelector("#convert");
            const details = document.querySelector("#details");
            const unmatched = document.querySelector("#unmatched");
            unmatched.innerHTML = "";
            details.style.display = "none";
            btn.classList.add("is-loading");
            fetch(`/convert?playlist_name=${playlistName}&playlist_id=${playlistId}&user_id=${window.sessionStorage.getItem('id')}&access_token=${window.sessionStorage.getItem('access_token')}&refresh_token=${window.sessionStorage.getItem('refresh_token')}`)
                .then(res => {
                    btn.classList.remove("is-loading");
                    res.json().then(res => {
                        if (res.error) {
                            document.querySelector("#errorModal").classList.add("is-active");
                        } else {
                            details.style.display = "flex";

                            for (let name of res) { 
                                let child = document.createElement("li");
                                child.innerHTML = decodeURIComponent(name);
                                unmatched.appendChild(child);
                            }
                        }
                        
                    });
                });
        }
    });
    // document.querySelector('#test').addEventListener('click', ()=>{
    //     fetch("http://localhost:8080/test");
    // });
});