
export const toTitleCase = word => (
    word.split('')
        .map((letter, index) => index === 0 ? letter.toUpperCase() : letter).join(''))

const punc = ['/', '.', '?', ',', ':', '"', '!']
const puncEndSentence = ['.', '?', ':', '!']
export const surrounds = ['[', ']', '(', ')', '"']

export const isCapitalized = word => word === toTitleCase(word)
export const isPunc = word => punc.includes(word)
export const endsSentence = word => puncEndSentence.includes(word)

export const removePunc = word => {
    for (let p of punc) {
        if (word.includes(p)) {
            word = word.replace(p, '')
        }
    }
    return word
}

export const hasPuncAfter = word => punc.includes(word.slice(-1)) ? [word.slice(-1)] : false
export const hasPuncBefore = word => punc.includes(word[0]) ? [word[0]] : false

export const alwaysCapitalized = word => {
    // TODO: call an endpoint for this (use code already in use in Python)
    return word === 'I'
}