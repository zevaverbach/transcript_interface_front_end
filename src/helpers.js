export const toTitleCase = word => (
    word.split('')
        .map((letter, index) => index === 0 ? letter.toUpperCase() : letter).join(''))

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

const punc = ['.', '?', ',', ':', '"', '!']
const puncEndSentence = ['.', '?', ':', '!']
const puncDelimitsPhrases = puncEndSentence.concat(',', ';')

export const isCapitalized = word => word === toTitleCase(word)
export const isPunc = word => punc.includes(word)
export const endsSentence = word => puncEndSentence.includes(word)
export const doesntHaveSpaceBefore = word => isPunc(word)
export const doesntHaveSpaceAfter = word => ['"', '('].includes(word)
export const isPhraseDelimiter = word => puncDelimitsPhrases.includes(word)

export const removePunc = word => {
    for (let p of punc) {
        if (word.includes(p)) {
            word = word.replace(p, '')
        }
    }
    return word
}

export const hasPuncAfter = word => punc.includes(word.slice(-1)[0]) ? word.slice(-1)[0] : false
export const hasPuncBefore = word => punc.includes(word[0]) ? word[0] : false

export const alwaysCapitalized = word => {
    // TODO: call an endpoint for this (use code already in use in Python)
    return word === 'I'
}

export const getOffsetsOfWordAtIndex = index => {
    // TODO: support multiple indices, or make a separate method for that
    const span = document.querySelectorAll('span.word')[index]
    console.log(span)
    return {
        x: span.offsetLeft,
        y: span.offsetTop,
        width: span.offsetWidth,
        height: span.offsetHeight,
    }
}

export const CONFIDENCE_THRESHOLD = .87