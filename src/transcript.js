import React, { Component } from 'react';

import Word from './word'



class Transcript extends Component {

    render() {

        const renderArray = [];

        for (let [index, wordObject] of Object.entries(this.props.transcript)) {

            let word = wordObject.name;
            let space = word === '.'
                ? ''
                : ' '
            let style = this.props.currentWordIndex === parseInt(index)
                ? { color: 'blue', fontStyle: 'bold', backgroundColor: 'gray' }
                : {}

            let text = space + word

            renderArray.push(<Word key={index}
                time={wordObject.time}
                style={style}
                onClick={this.props.onClickWord}
                text={text} />)
        }

        return renderArray;
    }

}

export default Transcript;