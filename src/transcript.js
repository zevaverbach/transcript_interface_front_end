import React from 'react';
import Paragraph from './paragraph'


const Transcript = props => {

    const paragraphs = [];
    let paragraph = [];

    for (let wordObject of props.transcript) {

        paragraph.push(wordObject)

        if (paragraph.length >= 80 && wordObject.puncAfter === '.') {
            paragraphs.push(
                <Paragraph
                    onClickWord={props.onClickWord}
                    key={wordObject.index}
                    words={paragraph}
                    selectedWordIndices={props.selectedWordIndices}
                />)
            paragraph = [];
        }
    }
    return paragraphs;
}

export default Transcript;