import React, { Fragment } from 'react';
import { isPunc } from './helpers'



const Word = props => {

    const onClick = () => {
        if (!isPunc(props.word.word)) props.onClick(props.word)
    }

    let style = props.currentlyPlaying && !isPunc(props.word.word)
        ? { color: 'blue', fontStyle: 'bold', backgroundColor: 'gray' }
        : {}

    return (
        <Fragment>
            <span onClick={onClick}>{props.word.space}</span>
            <span
                onClick={onClick}
                style={style}>{props.word.word}</span>

        </Fragment>
    )
}

export default Word;