import React from 'react';
import Word from './word'


const Paragraph = props =>
    <p>
        {props.words.map(word =>
            <Word
                key={word.index}
                word={word}
                onClick={props.onClickWord}
                confidenceThreshold={props.confidenceThreshold}
                currentlyPlaying={props.includesCurrentWord && props.currentWordIndex === word.index}
            />)}
    </p>

export default Paragraph;