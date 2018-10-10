import React, { Component } from 'react';

import Paragraph from './paragraph'



class Transcript extends Component {

    render() {

        const paragraphs = [];
        let paragraph = [];

        for (let wordObject of this.props.transcript) {

            paragraph.push(wordObject)

            if (paragraph.length >= 80 && wordObject.word === '.') {
                paragraphs.push(<Paragraph onClickWord={this.props.onClickWord}
                    words={paragraph}
                    currentWordIndex={this.props.currentWordIndex} />)
                paragraph = [];
            }

        }

        return paragraphs;
    }
}



export default Transcript;