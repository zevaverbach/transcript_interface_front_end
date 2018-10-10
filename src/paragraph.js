import React, { Component } from 'react';
import Word from './word'


class Paragraph extends Component {

    render() {

        const renderArray = [];

        for (let wordObject of this.props.words) {

            let space = wordObject.word === '.'
                ? ''
                : ' '
            let style = this.props.currentWordIndex === parseInt(wordObject.index)
                ? { color: 'blue', fontStyle: 'bold', backgroundColor: 'gray' }
                : {}

            if (wordObject.confidence <= .9 && wordObject.word !== '.') {
                style = Object.assign(style, { textDecoration: 'underline' })
            }

            let text = space + wordObject.word

            renderArray.push(<Word key={wordObject.index}
                time={wordObject.wordStart}
                style={style}
                onClick={this.props.onClickWord}
                text={text} />)

        }

        return <p>{renderArray}</p>;
    }
}

export default Paragraph;