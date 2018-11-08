import React from 'react';

import Paragraph from './paragraph'
import { doesntHaveSpaceAfter, doesntHaveSpaceBefore } from './helpers'



const Transcript = props => {

    const paragraphs = [];
    let paragraph = [];
    let prevWord = null
    const space = " "
    const noSpace = ""
    let unclosedQuote = false

    for (let wordObject of props.transcript) {

        if (!prevWord) wordObject.space = noSpace

        if (!unclosedQuote && wordObject.word === '"') {
            wordObject.space = space
        } else if (prevWord && prevWord.word === '"' && !unclosedQuote) {
            unclosedQuote = true
            wordObject.space = noSpace
        } else if (prevWord && prevWord.word === '"' && unclosedQuote) {
            unclosedQuote = false
            wordObject.space = space
        } else if (prevWord) {
            if (doesntHaveSpaceAfter(prevWord.word) || doesntHaveSpaceBefore(wordObject.word)) {
                wordObject.space = noSpace
            } else {
                wordObject.space = space
            }
        }

        prevWord = wordObject

        paragraph.push(wordObject)

        if (paragraph.length >= 80 && wordObject.word === '.') {
            paragraphs.push(
                <Paragraph
                    onClickWord={props.onClickWord}
                    key={wordObject.index}
                    words={paragraph}
                    selectedWordIndices={props.selectedWordIndices} />)
            paragraph = [];
        }
    }
    return paragraphs;
}

export default Transcript;