import React, { Fragment } from 'react';
import { CONFIDENCE_THRESHOLD } from './helpers';
import './App.css'


const Word = props => {

    let { word, selected, offset, firstSelectedWordIndex } = props

    let style = {};
    let className = 'word'
    if (selected) {
        style = { color: 'blue', fontStyle: 'bold', backgroundColor: 'gray' }
    }

    if (word.justChanged) {
        style = { backgroundColor: 'teal' }
    }

    if (word.confidence <= CONFIDENCE_THRESHOLD) {
        className += ' thin-underline'
    }

    const space = " "

    const onClick = () => props.onClick(word)

    const renderSpace = () => {

        if (offset === 0
            || (offset !== 0
                && word.index === firstSelectedWordIndex)) {
            return <span onClick={onClick}>{space}</span>
        } else {
            return <span onClick={onClick} onMouseOver={props.onMouseOver} style={style}>{space}</span>
        }
    }

    return (
        <Fragment>
            {renderSpace()}
            <span
                onClick={onClick}
                className={className}
                style={style}>{word.puncBefore ? word.puncBefore : ''}{word.word}{word.puncAfter ? word.puncAfter : ''}
            </span>

        </Fragment>
    )
}

export default Word;