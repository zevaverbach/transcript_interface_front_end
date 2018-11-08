import React, { Fragment } from 'react';
import { isPunc } from './helpers'



const Word = props => {

    let { word, selected, offset, firstSelectedWordIndex } = props
    let space = word.space

    const onClick = () => {
        if (!isPunc(word.word)) props.onClick(word)
    }

    let style = {};
    if (selected && !isPunc(word.word)) {
        style = { color: 'blue', fontStyle: 'bold', backgroundColor: 'gray' }
    }

    if (selected && offset) {
        style = { color: 'blue', fontStyle: 'bold', backgroundColor: 'gray' }
    }

    const renderSpace = () => {

        if (offset === 0
            || (offset < 0
                && word.index === firstSelectedWordIndex)) {
            return <span onClick={onClick}>{space}</span>
        } else {
            return <span onClick={onClick} style={style}>{space}</span>
        }
    }

    return (
        <Fragment>
            {renderSpace()}
            <span
                onClick={onClick}
                style={style}>{word.word}</span>

        </Fragment>
    )
}

export default Word;