// ==UserScript==
// @name         Custom Background music
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Have your custom background music in-game (Ctrl/Cmd + Shift + L)
// @author       Bhpsngum
// @include      /^https\:\/\/starblast\.io\/(app.html(\?.+)*)*$/
// @grant        none
// ==/UserScript==

(function () {
    let CustomBGM = {
        parseURL: async function (url) {
            try {
                let x = new URL(url), id;
        
                switch (x.hostname.replace(/^www\./, "")) {
                case "github.com": {
                    let paths = x.pathname.split(/\/+/).slice(1);
                    if (paths[2] == "blob") {
                    paths[2] = "raw";
                    x.pathname = "/" + paths.join("/");
                    }
                    return x.href;
                }
                case "youtube.com":
                    id = new URLSearchParams(x.search).get('v');
                    break;
                case "youtu.be":
                    id = x.pathname.replace(/(^\/*|\/*$)/g, "").split(/\/+/).at(-1);
                    break;
                default:
                    return url;
                }
                /* this should be executed for YT only */
                let data = await fetch("https://api-piped.mha.fi/streams/" + id);
                if (!data.ok) return url;
                data = (await data.json()).audioStreams;
                if (!Array.isArray(data)) return url;
                data = data.sort((a, b) => {
                let aF = a.mimeType.toLowerCase().replace(/^audio\//, ""), bF = b.mimeType.toLowerCase().replace(/^audio\//, "");
                if (aF == bF) return parseFloat(b.quality) - parseFloat(a.quality);
                if (aF == "mp3") return -1;
                if (bF == "mp3") return 1;
                if (aF == "webm") return -1;
                if (bF == "webm") return 1;
                return -1;
                })[0];
                if (data == null) return url;
                return data.url;
            }
            catch (e) {
                return url;
            }
        },
        deployMusic: function () {
            this.GameLoader.music.load();
            this.GameLoader.music.play();
            this.GameLoader.adjustMusicVolume();
        },
        loadMusic: function (url) {
            let GameLoader = this.GameLoader;
            if (GameLoader == null) return;
            let wantCustom = url !== '';
            localStorage.setItem('CustomBGM_want_to_use_custom', +wantCustom );
            if (wantCustom) localStorage.setItem('CustomBGM_url', url);
            if (GameLoader.music == null) return;
            GameLoader.music.innerHTML = '';
            GameLoader.music.src = '';
            if (wantCustom) this.parseURL(url).then(parsedURL => {
                let source = document.createElement("source");
                source.src = GameLoader.music.src = parsedURL;
                GameLoader.music.appendChild(source);
                this.deployMusic();
            })
            else {
                GameLoader.music.src = "https://starblast.data.neuronality.com/music/" + GameLoader.loaded_soundtrack;
                this.deployMusic();
            }
        },
        firstLoad: function () {
            this.loadMusic(localStorage.getItem('CustomBGM_url') || '');
        },
        initialize: function () {
            this.GameLoader = Object.values(Object.values(window.module.exports.settings).find(v => v && v.mode)).find(v => v && "function" == typeof v.loadMusic);

            let x = setInterval(function () {
                if (this.GameLoader && this.GameLoader.music) {
                    this.firstLoad();
                    clearInterval(x);
                    return;
                }
            }.bind(this), 1);
            
            window.addEventListener('keydown', function (e) {
                if ((e.metaKey || e.ctrlKey) && e.shiftKey) switch (e.keyCode) {
                    case 76: /* L */
                        let url = prompt("Enter music URL here:\n(Support YouTube, GitHub and direct link to audio file)\n - Leave blank and click confirm to reset back to default");
                        if (url != null) this.loadMusic(url);
                        break;
                }
            }.bind(this));
        }
    };

    CustomBGM.initialize();
})();