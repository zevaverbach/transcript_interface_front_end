import React, { Fragment } from 'react';
import { isPunc } from './helpers'



const Word = props => {

    const onClick = () => {
        if (!isPunc(props.word.word)) props.onClick(props.word)
    }

    let style = {};
    if (props.selected && !isPunc(props.word.word)) {
        style = { color: 'blue', fontStyle: 'bold', backgroundColor: 'gray' }
    }

    if (props.selected && props.offset) {
        style = { color: 'blue', fontStyle: 'bold', backgroundColor: 'gray' }
    }

    const renderSpace = () => {

        if (props.offset === 0 || (props.offset < 0 && props.word.index === props.firstSelectedWordIndex)) {
            return <span onClick={onClick}>{props.word.space}</span>
        } else {
            return <span
                onClick={onClick}
                style={style}
            >{props.word.space}
            </span>
        }
    }

    return (
        <Fragment>
            {renderSpace()}
            <span
                onClick={onClick}
                style={style}>{props.word.word}</span>

        </Fragment>
    )
}

export default Word;