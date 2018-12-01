import React, { Fragment } from 'react';
import { CONFIDENCE_THRESHOLD } from './config';
import ReactCursorPosition, { INTERACTIONS } from 'react-cursor-position';
import './App.css'


const Word = props => {

    let { word, selected, firstSelectedWordIndex } = props

    let style = {};
    let className = 'word'
    let selectedStyle = { color: 'blue', fontStyle: 'bold', backgroundColor: 'gray' }

    if (word.changed) {
        style = { backgroundColor: '#DDD' }
    }

    if (selected) {
        style = selectedStyle
    }

    if (word.confidence <= CONFIDENCE_THRESHOLD) {
        className += ' thin-underline'
    }

    const space = " "

    const onClick = () => props.onClick(word)

    const renderSpace = () => {
        if (word.index === firstSelectedWordIndex || word.changed) {
            return <span onClick={onClick}>{space}</span>
        } else {
            return <span onClick={onClick} style={style}>{space}</span>
        }
    }

    return (
        <Fragment>
            {renderSpace()}
            <ReactCursorPosition
                activationInteractionMouse={INTERACTIONS.HOVER}
                style={{ display: 'inline' }}
            >
                <span
                    onClick={onClick}
                    className={className}
                    style={style}>{word.puncBefore ? word.puncBefore.join('') : ''}{word.word}{word.puncAfter ? word.puncAfter.join('') : ''}
                </span>
            </ReactCursorPosition>

        </Fragment>
    )
}

export default Word;