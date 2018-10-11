import React from 'react';

import Paragraph from './paragraph'



const Transcript = props => {

    const paragraphs = [];
    let paragraph = [];
    let currentWordIndexFound = false;
    let includesCurrentWord = false;

    for (let [index, wordObject] of Object.entries(props.transcript)) {

        paragraph.push(wordObject)

        if (!currentWordIndexFound && wordObject.index === props.currentWordIndex) {
            includesCurrentWord = true
        }

        if (paragraph.length >= 80 && wordObject.word === '.') {
            paragraphs.push(
                <Paragraph
                    onClickWord={props.onClickWord}
                    key={index}
                    words={paragraph}
                    confidenceThreshold={props.confidenceThreshold}
                    includesCurrentWord={includesCurrentWord}
                    currentWordIndex={props.currentWordIndex} />)
            paragraph = [];
            includesCurrentWord = false;
        }
    }
    return paragraphs;
}

export default Transcript;