import React from 'react';
import Word from './word'
import uuidv4 from 'uuid/v4'

const Paragraph = props => (
    <p>
        {props.words.map(word =>
            <Word
                key={uuidv4()}
                word={word}
                onClick={props.onClickWord}
                confidenceThreshold={props.confidenceThreshold}
                selected={props.selectedWordPositions.includes(word.start)}
            />
        )}
    </p>
)

export default Paragraph;