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


export const isCapitalized = word => word === toTitleCase(word)
export const isPunc = word => ['.', '?', ',', ':', '"', '!'].includes(word)
export const endsSentence = word => ['.', '?', ':', '!'].includes(word)

export const alwaysCapitalized = word => {
    // TODO: call an endpoint for this (use code already in use in Python)
    return word === 'I'
}