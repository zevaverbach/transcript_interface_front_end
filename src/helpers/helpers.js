import { endsSentence } from './punc'

export const secondsTohhmmss = totalSeconds => {
    const decaseconds = totalSeconds - Math.floor(totalSeconds)
    const hours = Math.floor(totalSeconds / 3600)
    totalSeconds %= 3600
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const decasecondsString = decaseconds ? `${decaseconds.toPrecision(1)}`.slice(1) : '.0'
    return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}${decasecondsString}`
}

const pad = (number, width, padChar = '0') => {
    number = number + '';
    const padded = number.length >= width ? number : new Array(width - number.length + 1).join(padChar) + number;
    return padded
}

export const hhmmssToSeconds = hhmmss => {

    if (!hhmmss.includes(':')) return ~~hhmmss;

    let [hours, minutes, seconds] = hhmmss.split(':').map(i => ~~i);

    if (seconds === undefined) {
        seconds = minutes;
        minutes = hours;
        hours = undefined;
    }

    if (minutes === undefined) {
        seconds = hours;
        hours = undefined;
    }

    let totalSeconds = seconds;
    if (minutes) totalSeconds += minutes * 60;
    if (hours) totalSeconds += hours * 60 * 60;

    return totalSeconds

}

export const removeSelection = () => {
    if (window.getSelection) {
        window.getSelection().removeAllRanges();
    }
}


export const getOffsetsOfWordAtIndex = index => {
    // TODO: support multiple indices, or make a separate method for that
    const span = document.querySelectorAll('span.word')[index]
    return {
        x: span.offsetLeft,
        y: span.offsetTop,
        width: span.offsetWidth,
        height: span.offsetHeight,
    }
}


export const animateClick = (element, duration = 100) => {
    element.animate(
        [
            { color: 'white', background: '#444' },
            { color: '#444', background: 'white' },
        ],
        {
            duration,
            iterations: 1
        }
    )
}

export const makeTranscriptTxt = transcript => {
    let count = 0
    let transcriptTxt = `${secondsTohhmmss(transcript[0].start)}\n`
    for (let [index, word] of transcript.entries()) {
        count++
        transcriptTxt += `${word.puncBefore ? word.puncBefore.join('') : ''}${word.word}${word.puncAfter ? word.puncAfter.join('') : ''} `
        if (count >= 80 && word.puncAfter && endsSentence(word.puncAfter.slice(-1)[0])) {
            count = 0
            transcriptTxt += '\n\n';
            if (transcript[index + 1]) {
                transcriptTxt += `${secondsTohhmmss(transcript[index + 1].start)}\n`
            }
        }
    }
    return transcriptTxt
}

export const _downloadTxtFile = (transcript, filename) => {
    const transcriptTxt = makeTranscriptTxt(transcript)
    var element = document.createElement("a");
    var file = new Blob([transcriptTxt], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename
    element.click();
}


export const makeTranscriptSecondsObject = transcript => {
    const transcriptSecondsObject = {}
    Object.entries(transcript).forEach(([wordStart, word]) => {
        const wordStartInt = parseInt(wordStart)
        if (!transcriptSecondsObject[wordStartInt]) {
            transcriptSecondsObject[wordStartInt] = []
        }
        transcriptSecondsObject[wordStartInt].push(word)
    })
    return transcriptSecondsObject
}