import React from 'react';
import Paragraph from './paragraph'
import uuidv4 from 'uuid/v4'


const Transcript = props => {

    const paragraphs = [];
    let paragraph = [];
    const { firstWord, getNextWord, selectedWordPositions, onClickWord } = props
    let wordObject = firstWord

    while (true) {

        paragraph.push(wordObject)

        if (!wordObject.next
            || (paragraph.length >= 80
                && wordObject.puncAfter
                && wordObject.puncAfter.includes('.'))) {
            paragraphs.push(
                <Paragraph
                    onClickWord={onClickWord}
                    key={uuidv4()}
                    words={paragraph}
                    selectedWordPositions={selectedWordPositions}
                />)
            paragraph = [];
        }

        if (!wordObject.next) break
        wordObject = getNextWord(wordObject)
    }
    return paragraphs;
}

export default Transcript;
