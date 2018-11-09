import React, { Fragment } from 'react';


const Word = props => {

    let { word, selected, offset, firstSelectedWordIndex } = props

    let style = {};
    if (selected) {
        style = { color: 'blue', fontStyle: 'bold', backgroundColor: 'gray' }
    }

    const space = " "

    const onClick = () => props.onClick(word)

    const renderSpace = () => {

        if (offset === 0
            || (offset !== 0
                && word.index === firstSelectedWordIndex)) {
            return <span onClick={props.onClick}>{space}</span>
        } else {
            return <span onClick={props.onClick} style={style}>{space}</span>
        }
    }

    return (
        <Fragment>
            {renderSpace()}
            <span
                onClick={onClick}
                className='word'
                style={style}>{word.puncBefore ? word.puncBefore : ''}{word.word}{word.puncAfter ? word.puncAfter : ''}
            </span>

        </Fragment>
    )
}

export default Word;