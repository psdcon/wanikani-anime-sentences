
const div = document.querySelectorAll('.main')[0];

let url = `https://api.immersionkit.com/look_up_dictionary?keyword=不明&tags=Studio%20Ghibli&jlpt=1&wk=7&sort=Sentence+Length&category=anime`
fetch(url)
    .then(response => response.json())
    .then(data => {
        const examples = data.data[0].examples;
        let showJapanese = 'hover';
        let showEnglish = 'hover';
        let showFurigana = 'hover';  // TODO
        let playbackRate = 0.8

        let html = '';
        if (examples.length === 0) {
            html = 'No sentences found.'
        }
        else {
            let lim = Math.min(examples.length, 3)

            for (var i = 0; i < lim; i++) {
                const example = examples[i]
                html += `
    <div class="anime-example">
        <img src="${example['image_url']}" alt="">
        <div>
            <div class="title">${example['deck_name']}</div>
            <div class="ja">
                <span class="${showJapanese === 'hover'? 'show-on-hover': ''}">${example['sentence']}</span>
                <audio controls src="${example['sound_url']}"></audio>
            </div>
            <div class="en">
                <span class="${showEnglish === 'hover'? 'show-on-hover': ''}">${example['translation']}</span>
            </div>
        </div>
    </div>`
            }
        }

        div.innerHTML = html

        let audios = document.querySelectorAll(".anime-example audio")
        audios.forEach((a) => a.playbackRate = playbackRate)
    })
