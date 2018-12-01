import React, { Fragment } from 'react';
import { CONFIDENCE_THRESHOLD } from './config';
import './App.css'


const Word = props => {

    let { word, selected, firstSelectedWordIndex, isActive } = props

    let style = {};
    let className = 'word'
    let selectedStyle = { color: 'blue', fontStyle: 'bold', backgroundColor: 'gray' }

    if (word.changed) {
        style = { backgroundColor: '#DDD' }
    }

    if (selected || isActive) {
        // isActive is a proper from ReactCursorPosition, meaning the cursor is over this word
        style = selectedStyle
    }

    if (word.confidence <= CONFIDENCE_THRESHOLD) {
        className += ' thin-underline'
    }

    const space = " "

    const onClick = () => props.onClick(word)

    const renderSpace = () => {
        if (word.index === firstSelectedWordIndex || word.changed || isActive) {
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
                className={className}
                style={style}>{word.puncBefore ? word.puncBefore.join('') : ''}{word.word}{word.puncAfter ? word.puncAfter.join('') : ''}
            </span>

        </Fragment>
    )
}

export default Word;