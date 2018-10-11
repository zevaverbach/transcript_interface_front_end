import React, { Component } from 'react';

import Paragraph from './paragraph'



class Transcript extends Component {

    render() {

        const paragraphs = [];
        let paragraph = [];

        for (let [index, wordObject] of Object.entries(this.props.transcript)) {

            paragraph.push(wordObject)

            if (paragraph.length >= 80 && wordObject.word === '.') {
                paragraphs.push(
                    <Paragraph
                        onClickWord={this.props.onClickWord}
                        key={index}
                        words={paragraph}
                        confidenceThreshold={this.props.confidenceThreshold}
                        currentWordIndex={this.props.currentWordIndex} />)
                paragraph = [];
            }

        }

        return paragraphs;
    }
}



export default Transcript;