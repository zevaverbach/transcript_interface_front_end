// const nextWord = previousState[wordToRemove.index]
// if (!nextWord.alwaysCapitalized && isCapitalized(nextWord.word) && endsSentence(wordToRemove.word)) {
//     previousState = previousState.map(word => word === nextWord
//         ? Object.assign(nextWord, { word: nextWord.word.toLowerCase() })
//         : word)
// TODO: check if a given word is punctuation, and act accordingly:
// wordStart and wordEnd are null
// capitalization of next word after a period/question mark/exclamation
// un-capitalization of next word if a period/q/ex is replaced with a non-terminating punc
// if (isPunc(nextWord)) {
//     thirdTranscriptChunk = transcript.slice(index + 2)
// } else {
//     thirdTranscriptChunk = transcript
//         .slice(index + 1)
//         .map(word => Object.assign(word, { index: word.index + 1 }))
// }

// const firstWordNextPhrase = thirdTranscriptChunk[0]

// if (endsSentence(punc)
//     && !isCapitalized(firstWordNextPhrase.word)
//     && !firstWordNextPhrase.alwaysCapitalized) {

//     thirdTranscriptChunk = [Object.assign(firstWordNextPhrase, {
//         word: toTitleCase(firstWordNextPhrase.word),
//         key: index + 2,
//         index: index + 2,
//         wordStart: nextWordStart,
//     })]
//         .concat(thirdTranscriptChunk.slice(1))
// }

// if (punc === ','
//     && isCapitalized(firstWordNextPhrase.word)
//     && !firstWordNextPhrase.alwaysCapitalized) {

//     thirdTranscriptChunk = [Object.assign(firstWordNextPhrase, {
//         word: firstWordNextPhrase.word.toLowerCase(),
//         key: index + 2,
//         index: index + 2,
//         wordStart: nextWordStart,
//     })]
//         .concat(thirdTranscriptChunk.slice(1))
// }



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
