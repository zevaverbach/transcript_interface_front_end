import React, { Component } from 'react';
import Word from './word'


class Paragraph extends Component {

    render() {

        const renderArray = [];

        for (let wordObject of this.props.words) {

            let style = this.props.currentWordIndex === parseInt(wordObject.index)
                ? { color: 'blue', fontStyle: 'bold', backgroundColor: 'gray' }
                : {}

            if (wordObject.confidence <= this.props.confidenceThreshold && wordObject.word !== '.') {
                style = Object.assign(style, { textDecoration: 'underline' })
            }

            renderArray.push(<Word key={wordObject.index}
                time={wordObject.wordStart}
                style={style}
                space={wordObject.space}
                onClick={this.props.onClickWord}
                text={wordObject.word} />)

        }

        return <p>{renderArray}</p>;
    }
}

export default Paragraph;