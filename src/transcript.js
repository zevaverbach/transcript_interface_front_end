import React from 'react';
import Paragraph from './paragraph'


const Transcript = props => {

    const paragraphs = [];
    let paragraph = [];
    const transcript = props.transcript
    const transcriptLength = transcript.length

    for (let [index, wordObject] of transcript.entries()) {

        paragraph.push(wordObject)

        if (index === transcriptLength - 1
            || (paragraph.length >= 80
                && wordObject.puncAfter
                && wordObject.puncAfter.includes('.'))) {
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