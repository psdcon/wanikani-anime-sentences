// ==UserScript==
// @name         Wanikani Anime Sentences
// @version      1.0.0
// @namespace    psdcon
// @author       psdcon
// @description  This script is in development

// @include     /^https://(www|preview).wanikani.com//
// @match        https://www.wanikani.com/lesson/session
// @match        https://www.wanikani.com/review/session
// @match        https://www.wanikani.com/vocabulary/*
// @match        https://preview.wanikani.com/lesson/session
// @match        https://preview.wanikani.com/review/session
// @match        https://preview.wanikani.com/vocabulary/*

// @require      https://greasyfork.org/scripts/430565-wanikani-item-info-injector/code/WaniKani%20Item%20Info%20Injector.user.js?version=969075
// @require     file:///C:/Users/seanw/Documents/Code/wanikani-anime-sentences/userscript.js
// @updateURL   https://github.com/psdcon/wanikani-anime-sentences/blob/main/userscript.js
// @copyright   2021+, Paul Connolly
// @license     MIT; http://opensource.org/licenses/MIT
// @run-at      document-end
// @grant       none
// ==/UserScript==

(() => {

    //--------------------------------------------------------------------------------------------------------------//
    //-----------------------------------------------INITIALIZATION-------------------------------------------------//
    //--------------------------------------------------------------------------------------------------------------//
    const wkof = window.wkof;

    const scriptId = "anime-sentences";
    const scriptName = "Anime Sentences";

    let state = {
        settings: {
            playbackRate: 0.75,
            showEnglish: 'always',
            showJapanese: 'always',
            showFurigana: 'onhover',
            filterAnime: [],
            filterWaniKaniLevel: true,
        },
    };

    // Application start Point
    main();

    function main() {
        init(() => wkItemInfo.forType(`vocabulary`).under(`examples`).notify(
            () => addAnimeSentences())
        );
    }

    function init(callback) {
        createStyle();

        if (wkof) {
            wkof.include("ItemData,Settings");
            wkof
                .ready("ItemData,Settings")
                .then(loadSettings)
                .then(proccessLoadedSettings)
                //.then(getKanji)
                //.then(extractKanjiFromResponse)
                .then(callback);
        } else {
            console.warn(
                `${scriptName}: You are not using Wanikani Open Framework which this script utlizes to see the kanji you learned and highlights it with a different color, it also provides the settings dialog for the script. You can still use Advanced Context Sentence normally though`
            );
            callback();
        }
    }

    function addAnimeSentences() {
        let type = document.querySelectorAll("#main-info")[0].classList[0];
        let queryString = document.querySelectorAll("#character")[0].innerText;
        console.log(type, queryString)

        let header = document.createElement("h2");
        header.innerText = `Anime Sentences`

        let div = document.createElement("div");

        let url = `https://api.immersionkit.com/look_up_dictionary?keyword=${queryString}&tags=Studio%20Ghibli&jlpt=1&wk=7&sort=Sentence+Length&category=anime`
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const examples = data.data[0].examples;
                let showJapanese = state.settings.showJapanese;
                let showEnglish = state.settings.showEnglish;
                let showFurigana = state.settings.showFurigana;
                let playbackRate = state.settings.playbackRate

                let html = '';
                if (examples.length === 0) {
                    html = 'No sentences found.'
                } else {
                    let lim = Math.min(examples.length, 3)

                    for (var i = 0; i < lim; i++) {
                        const example = examples[i]
                        html += `
    <div class="anime-example">
        <img src="${example['image_url']}" alt="">
        <div>
            <div class="title">${example['deck_name']}</div>
            <div class="ja">
                <span class="${showJapanese === 'hover' ? 'show-on-hover' : ''}">${example['sentence']}</span>
                <audio controls src="${example['sound_url']}"></audio>
            </div>
            <div class="en">
                <span class="${showEnglish === 'hover' ? 'show-on-hover' : ''}">${example['translation']}</span>
            </div>
        </div>
    </div>`
                    }
                }

                div.innerHTML = html

                let audios = document.querySelectorAll(".anime-example audio")
                audios.forEach((a) => {
                    a.playbackRate = playbackRate
                })
            })


        let contextSentencesSlideEl = document.querySelectorAll("#supplement-voc-context-sentences-slide")[0];
        let animeSectionEl = contextSentencesSlideEl.firstChild.firstChild
        animeSectionEl.prepend(div)
        animeSectionEl.prepend(header)

        if (wkof) {
            addSettingsBtn(header);
        }
    }

    function addSettingsBtn(animeSectionEl) {
        const settings = document.createElement("i");
        settings.setAttribute("class", "icon-gear");
        settings.setAttribute(
            "style",
            "font-size: 14px; cursor: pointer; vertical-align: middle; margin-left: 10px;"
        );
        settings.onclick = openSettings;

        if (!animeSectionEl.querySelector("i.icon-gear")) {
            animeSectionEl.append(settings);
        }
    }

    //--------------------------------------------------------------------------------------------------------------//
    //----------------------------------------------SETTINGS--------------------------------------------------------//
    //--------------------------------------------------------------------------------------------------------------//

    function loadSettings() {
        return wkof.Settings.load(scriptId, state.settings);
    }

    function proccessLoadedSettings() {
        state.settings = wkof.settings[scriptId];
    }

    function openSettings() {
        var config = {
            script_id: scriptId,
            title: scriptName,
            on_save: updateSettings,
            content: {
                general: {
                    type: "section",
                    label: "General"
                },
                playbackRate: {
                    type: "number",
                    label: "Playback Rate",
                    step: 0.1,
                    min: 0.5,
                    max: 2,
                    hover_tip: "Speed to play back audio examples",
                    default: state.settings.playbackRate
                },
                showJapanese: {
                    type: "dropdown",
                    label: "Show Japanese",
                    hover_tip: "TODO",
                    content: {
                        always: "Always",
                        onhover: "On Hover"
                    },
                    default: state.settings.showJapanese
                },
                showEnglish: {
                    type: "dropdown",
                    label: "Show English",
                    hover_tip: "TODO",
                    content: {
                        always: "Always",
                        onhover: "On Hover"
                    },
                    default: state.settings.showEnglish
                },
                tooltip: {
                    type: "section",
                    label: "Filters"
                },
                filterWaniKaniLevel: {
                    type: "checkbox",
                    label: "WaniKani Level",
                    hover_tip:
                        "",
                    default: state.settings.filterWaniKaniLevel,
                },
                filterAnime: {
                    type: "list",
                    label: "Anime",
                    multi: true,
                    hover_tip: "",
                    default: state.settings.filterAnime,
                    content: {
                        studio_ghibli: "Studio Ghibli",
                        others: "Others"
                    }
                }
            }
        };
        var dialog = new wkof.Settings(config);
        dialog.open();
    }

    // Called when the user clicks the Save button on the Settings dialog.
    function updateSettings() {
        state.settings = wkof.settings[scriptId];
    }


    // Styles
    function createStyle() {
        const style = document.createElement("style");
        style.setAttribute("id", "anime-sentences-style");
        style.innerHTML = `
        .anime-example {
            display: flex;
            align-items: center;
            margin-bottom: 1em;
        }

        .anime-example .show-on-hover {
            background: #ccc;
            color: #ccc;
        }
        .anime-example:hover .show-on-hover {
            background: inherit;
            color: inherit;
        }

        .anime-example .title {
            font-weight: 700;
        }

        .anime-example img {
            margin-right:1em;
            max-width: 200px;
        }
    `;

        document.querySelector("head").append(style);
    }

})();