import React, { Component } from 'react';

import Word from './word'



class Transcript extends Component {

    render() {

        const renderArray = [];

        for (let [index, wordObject] of Object.entries(this.props.transcript)) {

            let space = wordObject.word === '.'
                ? ''
                : ' '
            let style = this.props.currentWordIndex === parseInt(index)
                ? { color: 'blue', fontStyle: 'bold', backgroundColor: 'gray' }
                : {}

            if (wordObject.confidence <= .8 && wordObject.word !== '.') {
                style = Object.assign(style, { textDecoration: 'underline' })
            }

            let text = space + wordObject.word

            renderArray.push(<Word key={index}
                time={wordObject.wordStart}
                style={style}
                onClick={this.props.onClickWord}
                text={text} />)
        }

        return renderArray;
    }

}

export default Transcript;