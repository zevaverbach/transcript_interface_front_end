import React, { Fragment } from 'react';
import { isPunc } from './helpers'



const Word = props => {

    const onClick = () => {
        if (!isPunc(props.word.word)) props.onClick(props.word)
    }

    let style = props.currentlyPlaying && !isPunc(props.word.word)
        ? { color: 'blue', fontStyle: 'bold', backgroundColor: 'gray' }
        : {}

    if (props.word.confidence <= props.confidenceThreshold && props.word.word !== '.') {
        style = Object.assign(style, { textDecoration: 'underline' })
    }

    if (props.currentlyPlaying) {
        console.log(props.word.word, props.word.wordStart, props.word.index)
    }

    return (
        <Fragment>
            <span>{props.word.space}</span>
            <span
                onClick={onClick}
                style={style}>{props.word.word}</span>

        </Fragment>
    )
}

export default Word;