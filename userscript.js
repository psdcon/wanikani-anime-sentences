// ==UserScript==
// @name         Wanikani Anime Sentences
// @description  Adds example sentences from anime movies and shows for vocabulary
// @version      1.0.2
// @author       psdcon
// @namespace    wkanimesentences

// @include     /^https://(www|preview).wanikani.com//
// @match        https://www.wanikani.com/lesson/session
// @match        https://www.wanikani.com/review/session
// @match        https://www.wanikani.com/vocabulary/*
// @match        https://preview.wanikani.com/lesson/session
// @match        https://preview.wanikani.com/review/session
// @match        https://preview.wanikani.com/vocabulary/*

// @require     https://greasyfork.org/scripts/430565-wanikani-item-info-injector/code/WaniKani%20Item%20Info%20Injector.user.js?version=969075
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
            numExamples: 3,
            playbackRate: 0.75,
            showEnglish: 'onhover',
            showJapanese: 'always',
            showFurigana: 'onhover',
            sentenceLengthSort: 'asc',
            filterWaniKaniLevel: true,
            filterGeneralAnime: {},
            // Ghibli films are enabled by default
            filterGhibli: {0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true},
        },
        item: null, // current vocab from wkinfo
        userLevel: '', // most recent level progression
        immersionKitData: null, // cached so sentences can be re-rendered after settings change
        sentencesEl: null, // referenced so sentences can be re-rendered after settings change
    };

    // Titles taken from https://www.immersionkit.com/information
    const animeTitles = {
        0: "Angel Beats!",
        1: "Anohana the flower we saw that day",
        2: "Assassination Classroom Season 1",
        3: "Bakemonogatari",
        4: "Boku no Hero Academia Season 1",
        5: "Cardcaptor Sakura",
        6: "Clannad",
        7: "Code Geass Season 1",
        8: "Death Note",
        9: "Durarara!!",
        10: "Erased",
        11: "Fullmetal Alchemist Brotherhood",
        12: "K-On!",
        13: "Kanon (2006)",
        14: "Kill la Kill",
        15: "Kokoro Connect",
        16: "Little Witch Academia",
        17: "Mahou Shoujo Madoka Magica",
        18: "No Game No Life",
        19: "Noragami",
        20: "Psycho Pass",
        21: "Re Zero − Starting Life in Another World",
        22: "Shirokuma Cafe",
        23: "Steins Gate",
        24: "Sword Art Online",
        25: "The Garden of Words",
        26: "The Girl Who Leapt Through Time",
        27: "Wolf Children",
        28: "Your Lie in April",
    }

    const ghibliTitles = {
        0: "Castle in the sky",
        1: "Howl's Moving Castle",
        2: "Kiki's Delivery Service",
        3: "My Neighbor Totoro",
        4: "Spirited Away",
        5: "The Cat Returns",
        6: "The Secret World of Arrietty",
        7: "The Wind Rises",
        8: "When Marnie Was There",
    }

    main();

    function main() {
        init(() => wkItemInfo.forType(`vocabulary`).under(`examples`).notify(
            (item) => onExamplesVisible(item))
        );
    }

    function init(callback) {
        createStyle();

        if (wkof) {
            wkof.include("ItemData,Settings");
            wkof
                .ready("Apiv2,Settings")
                .then(loadSettings)
                .then(processLoadedSettings)
                .then(getLevel)
                .then(callback);
        } else {
            console.warn(
                `${scriptName}: You are not using Wanikani Open Framework which this script utlizes to see the kanji you learned and highlights it with a different color, it also provides the settings dialog for the script. You can still use Advanced Context Sentence normally though`
            );
            callback();
        }
    }

    function getLevel() {
        wkof.Apiv2.fetch_endpoint('level_progressions', options).then((response) => {
            state.userLevel = response.data[response.data.length - 1].data.level
        });
    }

    function onExamplesVisible(item) {
        state.item = item // current vocab item
        addAnimeSentences()
    }

    function addAnimeSentences() {
        let queryString = state.item.characters.replace('〜', '');  // for "counter" kanji

        let parentEl = document.createElement("div");
        parentEl.setAttribute("id", 'anime-sentences-parent')

        let header = state.item.on !== 'itemPage' ? document.createElement("h2") : document.createElement("h3");
        header.innerText = 'Anime Sentences'

        const settingsBtn = document.createElement("i");
        settingsBtn.setAttribute("class", "fa fa-gear");
        settingsBtn.setAttribute("style", "font-size: 14px; cursor: pointer; vertical-align: middle; margin-left: 10px;");
        settingsBtn.onclick = openSettings
        let sentencesEl = document.createElement("div");
        sentencesEl.innerText = 'Loading...'

        header.append(settingsBtn)
        parentEl.append(header)
        parentEl.append(sentencesEl)
        state.sentencesEl = sentencesEl

        if (state.item.injector) {
            if (state.item.on === 'lesson') {
                state.item.injector.appendAtTop(null, parentEl)
            } else { // itemPage, review
                state.item.injector.append(null, parentEl)
            }
        }

        const wkLevelFilter = state.settings.filterWaniKaniLevel ? state.userLevel : '';
        let url = `https://api.immersionkit.com/look_up_dictionary?keyword=${queryString}&tags=&jlpt=&wk=${wkLevelFilter}&sort=None&category=anime`
        fetch(url)
            .then(response => response.json())
            .then(data => {
                let examples = data.data[0].examples
                examples.sort((a,b) => b.sentence.length - a.sentence.length)
                state.immersionKitData = examples
                renderSentences()
            });
    }

    function getDesiredShows() {
        // Convert settings dictionaries to list of titles
        let titles = []
        for (const [key, value] of Object.entries(state.settings.filterGeneralAnime)) {
            if (value === true) {
                titles.push(animeTitles[key])
            }
        }
        for (const [key, value] of Object.entries(state.settings.filterGhibli)) {
            if (value === true) {
                titles.push(ghibliTitles[key])
            }
        }
        return titles
    }

    function renderSentences() {
        // Called from immersionkit response, and on settings save
        let examples = state.immersionKitData;
        let desiredTitles = getDesiredShows()
        examples = examples.filter(ex => desiredTitles.includes(ex.deck_name))

        let showJapanese = state.settings.showJapanese;
        let showEnglish = state.settings.showEnglish;
        let showFurigana = state.settings.showFurigana;
        let playbackRate = state.settings.playbackRate

        let html = '';
        if (examples.length === 0) {
            html = 'No sentences found.'
        } else {
            let lim = Math.min(examples.length, state.settings.numExamples)

            for (var i = 0; i < lim; i++) {
                const example = examples[i]

                let japaneseText = state.settings.showFurigana === 'never' ?
                    example.sentence :
                    new Furigana(example.sentence_with_furigana).ReadingHtml

                html += `
    <div class="anime-example">
        <img src="${example.image_url}" alt="">
        <div class="anime-example-text">
            <div class="title" title="${example.id}">${example.deck_name}</div>
            <div class="ja">
                <span class="${showJapanese === 'onhover' ? 'show-on-hover' : ''} ${showFurigana === 'onhover' ? 'show-ruby-on-hover' : ''}  ${showJapanese === 'onclick' ? 'show-on-click' : ''}">${japaneseText}</span>
                <span><button class="audio-btn audio-idle"></button></span>
                <audio src="${example.sound_url}"></audio>
            </div>
            <div class="en">
                <span class="${showEnglish === 'onhover' ? 'show-on-hover' : ''} ${showEnglish === 'onclick' ? 'show-on-click' : ''}">${example.translation}</span>
            </div>
        </div>
    </div>`
            }
        }

        let sentencesEl = state.sentencesEl
        sentencesEl.innerHTML = html

        let audios = document.querySelectorAll(".anime-example audio")
        audios.forEach((a) => {
            a.playbackRate = playbackRate
            let button = a.parentNode.querySelector('button')
            a.onplay = () => {
                button.setAttribute("class", "audio-btn audio-play")
            };
            a.onended = () => {
                button.setAttribute('class', "audio-btn audio-idle")
            };
        })

        // Click anywhere plays the audio
        let exampleEls = document.querySelectorAll(".anime-example")
        exampleEls.forEach((a) => {
            a.onclick = function () {
                let audio = this.querySelector('audio')
                audio.play()
            }
        });

        // Assing onclick function to .show-on-click elements
        document.querySelectorAll(".show-on-click").forEach((a) => {
            a.onclick = function () {
                this.classList.toggle('show-on-click');
            }
        });
    }

    //--------------------------------------------------------------------------------------------------------------//
    //----------------------------------------------SETTINGS--------------------------------------------------------//
    //--------------------------------------------------------------------------------------------------------------//

    function loadSettings() {
        return wkof.Settings.load(scriptId, state.settings);
    }

    function processLoadedSettings() {
        state.settings = wkof.settings[scriptId];
    }

    function openSettings() {
        let config = {
            script_id: scriptId,
            title: scriptName,
            on_save: updateSettings,
            content: {
                general: {
                    type: "section",
                    label: "General"
                },
                numExamples: {
                    type: "number",
                    label: "Number of Examples",
                    step: 1,
                    min: 1,
                    max: 10,
                    hover_tip: "The maximum number of sentences to show for each word.",
                    default: state.settings.numExamples
                },
                playbackRate: {
                    type: "number",
                    label: "Playback Speed",
                    step: 0.1,
                    min: 0.5,
                    max: 2,
                    hover_tip: "Speed to play back audio.",
                    default: state.settings.playbackRate
                },
                showJapanese: {
                    type: "dropdown",
                    label: "Show Japanese",
                    hover_tip: "When to show Japanese text. Hover enables transcribing a sentences first (play audio by clicking the image to avoid seeing the answer).",
                    content: {
                        always: "Always",
                        onhover: "On Hover",
                        onclick: "On Click",
                    },
                    default: state.settings.showJapanese
                },
                showFurigana: {
                    type: "dropdown",
                    label: "Show Furigana",
                    hover_tip: "These have been autogenerated so there may be mistakes.",
                    content: {
                        always: "Always",
                        onhover: "On Hover",
                        never: "Never",
                    },
                    default: state.settings.showFurigana
                },
                showEnglish: {
                    type: "dropdown",
                    label: "Show English",
                    hover_tip: "Hover allows testing your understanding before seeing the answer.",
                    content: {
                        always: "Always",
                        onhover: "On Hover",
                        onclick: "On Click",
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
                    hover_tip: "Only show sentences appropriate for your current Wanikani level.",
                    default: state.settings.filterWaniKaniLevel,
                },
                filterGeneralAnime: {
                    type: "list",
                    label: "Anime",
                    multi: true,
                    size: 6,
                    hover_tip: "Select which anime you'd like to see examples from.",
                    default: state.settings.filterGeneralAnime,
                    content: animeTitles
                },
                filterGhibli: {
                    type: "list",
                    label: "Ghibli",
                    multi: true,
                    size: 6,
                    hover_tip: "Select which Studio Ghibli movies you'd like to see examples from.",
                    default: state.settings.filterGhibli,
                    content: ghibliTitles
                }
            }
        };
        let dialog = new wkof.Settings(config);
        dialog.open();
    }

    // Called when the user clicks the Save button on the Settings dialog.
    function updateSettings() {
        state.settings = wkof.settings[scriptId];
        renderSentences();
    }

    //--------------------------------------------------------------------------------------------------------------//
    //-----------------------------------------------STYLES---------------------------------------------------------//
    //--------------------------------------------------------------------------------------------------------------//

    function createStyle() {
        const style = document.createElement("style");
        style.setAttribute("id", "anime-sentences-style");
        style.innerHTML = `
        .anime-example {
            display: flex;
            align-items: center;
            margin-bottom: 1em;
            cursor: pointer;
        }

        /* Make text and background color the same to hide text */
        .anime-example-text .show-on-hover {
            background: #ccc;
            color: #ccc;
        }
        .anime-example-text .show-on-hover:hover {
            background: inherit;
            color: inherit
        }

        /* Furigana hover*/
        .anime-example-text .show-ruby-on-hover ruby rt {
            visibility: hidden;
        }
        .anime-example-text:hover .show-ruby-on-hover ruby rt {
            visibility: visible;
        }

        .show-on-click {
            background: #ccc;
            color: #ccc;
        }
        
        .anime-example .title {
            font-weight: 700;
        }        
        
        .anime-example .ja {
            font-size: 2em;
        }

        .anime-example img {
            margin-right:1em;
            max-width: 200px;
        }
    `;

        document.querySelector("head").append(style);
    }


    //--------------------------------------------------------------------------------------------------------------//
    //----------------------------------------------FURIGANA--------------------------------------------------------//
    //--------------------------------------------------------------------------------------------------------------//
    // https://raw.githubusercontent.com/helephant/Gem/master/src/Gem.Javascript/gem.furigana.js
    function Furigana(reading) {
        var segments = ParseFurigana(reading || "");

        this.Reading = getReading();
        this.Expression = getExpression();
        this.Hiragana = getHiragana();
        this.ReadingHtml = getReadingHtml();

        function getReading() {
            var reading = "";
            for (var x = 0; x < segments.length; x++) {
                reading += segments[x].Reading;
            }
            return reading.trim();
        }

        function getExpression() {
            var expression = "";
            for (var x = 0; x < segments.length; x++)
                expression += segments[x].Expression;
            return expression;
        }

        function getHiragana() {
            var hiragana = "";
            for (var x = 0; x < segments.length; x++) {
                hiragana += segments[x].Hiragana;
            }
            return hiragana;
        }

        function getReadingHtml() {
            var html = "";
            for (var x = 0; x < segments.length; x++) {
                html += segments[x].ReadingHtml;
            }
            return html;
        }
    }

    function FuriganaSegment(baseText, furigana) {
        this.Expression = baseText;
        this.Hiragana = furigana.trim();
        this.Reading = baseText + "[" + furigana + "]";
        this.ReadingHtml = "<ruby><rb>" + baseText + "</rb><rt>" + furigana + "</rt></ruby>";
    }

    function UndecoratedSegment(baseText) {
        this.Expression = baseText;
        this.Hiragana = baseText;
        this.Reading = baseText;
        this.ReadingHtml = baseText;
    }

    function ParseFurigana(reading) {
        var segments = [];

        var currentBase = "";
        var currentFurigana = "";
        var parsingBaseSection = true;
        var parsingHtml = false;

        var characters = reading.split('');

        while (characters.length > 0) {
            var current = characters.shift();

            if (current === '[') {
                parsingBaseSection = false;
            } else if (current === ']') {
                nextSegment();
            } else if (isLastCharacterInBlock(current, characters) && parsingBaseSection) {
                currentBase += current;
                nextSegment();
            } else if (!parsingBaseSection)
                currentFurigana += current;
            else
                currentBase += current;
        }

        nextSegment();

        function nextSegment() {
            if (currentBase)
                segments.push(getSegment(currentBase, currentFurigana));
            currentBase = "";
            currentFurigana = "";
            parsingBaseSection = true;
            parsingHtml = false;
        }

        function getSegment(baseText, furigana) {
            if (!furigana || furigana.trim().length === 0)
                return new UndecoratedSegment(baseText);
            return new FuriganaSegment(baseText, furigana);
        }

        function isLastCharacterInBlock(current, characters) {
            return !characters.length ||
                (isKanji(current) !== isKanji(characters[0]) && characters[0] !== '[');
        }

        function isKanji(character) {
            return character && character.charCodeAt(0) >= 0x4e00 && character.charCodeAt(0) <= 0x9faf;
        }

        return segments;
    }

})();
