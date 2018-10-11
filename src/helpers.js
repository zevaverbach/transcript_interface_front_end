
const toTitleCase = word => word.split('').map((letter, index) => index === 0 ? letter.toUpperCase() : letter).join('')

export default toTitleCase;

