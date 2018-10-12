import nlp from 'compromise'

export const toTitleCase = word => word.split('').map((letter, index) => index === 0 ? letter.toUpperCase() : letter).join('');

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

const shouldAlwaysBeCapitalized = word => {
    // check for proper nouns
    // "I"
}

console.log(nlp('Portsmouth').places())

export const isCapitalized = word => word === toTitleCase(word)
export const isPunc = word => ['.', '?', ',', ':'].includes(word)
export const endsSentence = word => ['.', '?', ':'].includes(word)