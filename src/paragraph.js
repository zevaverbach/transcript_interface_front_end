import React from 'react';
import Word from './word'

const Paragraph = props =>
    <p>
        {props.words.map(word => {

            const { selectedWordIndices } = props
            const { start, offset } = selectedWordIndices

            let selected = false;
            if (start === word.index) {
                selected = true;
                console.log(word.index, start, offset)
            } else if (
                offset &&
                start < word.index &&
                start + offset >= word.index
            ) {
                selected = true;
                console.log('2', word.index, start, offset)
            } else if (
                offset &&
                start > word.index &&
                start + offset <= word.index
            ) {
                selected = true;
                console.log('3', word.index, start, offset)
            }



            return (
                <Word
                    key={word.index}
                    word={word}
                    onClick={props.onClickWord}
                    confidenceThreshold={props.confidenceThreshold}
                    selected={selected}
                />
            )
        })}
    </p>

export default Paragraph;