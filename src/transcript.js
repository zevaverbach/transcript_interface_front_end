import React from 'react';
import Paragraph from './paragraph'


const Transcript = props => {

    const paragraphs = [];
    let paragraph = [];

    for (let wordObject of props.transcript) {

        paragraph.push(wordObject)

        if (paragraph.length >= 80 && wordObject.puncAfter && wordObject.puncAfter.includes('.')) {
            paragraphs.push(
                <Paragraph
                    onClickWord={props.onClickWord}
                    key={wordObject.index}
                    words={paragraph}
                    selectedWordIndices={props.selectedWordIndices}
                    onMouseOver={props.onMouseOver}
                />)
            paragraph = [];
        }
    }
    return paragraphs;
}

export default Transcript;