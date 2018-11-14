import React from 'react';
import Word from './word'

const Paragraph = props => {
    return (
        <p>
            {props.words.map(word => {
                const { selectedWordIndices } = props
                const { start, offset } = selectedWordIndices

                let selected = false;
                if (start === word.index) {
                    selected = true;
                } else if (
                    offset &&
                    start < word.index &&
                    start + offset >= word.index
                ) {
                    selected = true;
                } else if (
                    offset &&
                    start > word.index &&
                    start + offset <= word.index
                ) {
                    selected = true;
                }

                let firstSelectedWordIndex;
                if (offset >= 0) {
                    firstSelectedWordIndex = start
                } else {
                    firstSelectedWordIndex = start + offset
                }

                return (
                    <Word
                        key={word.index}
                        word={word}
                        onClick={props.onClickWord}
                        confidenceThreshold={props.confidenceThreshold}
                        selected={selected}
                        offset={offset}
                        firstSelectedWordIndex={firstSelectedWordIndex}
                        onMouseOver={props.onMouseOver}
                    />
                )
            })}
        </p>
    )
}

export default Paragraph;