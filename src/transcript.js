import React from 'react';


const Transcript = ({ currentWordIndex, transcript }) => {

    const renderArray = [];

    for (let [index, wordObject] of Object.entries(transcript)) {

        let word = wordObject.name;
        let space = word === '.'
            ? ''
            : ' '
        let style = currentWordIndex === parseInt(index)
            ? { color: 'blue', fontStyle: 'bold', backgroundColor: 'gray' }
            : {}

        renderArray.push(<span key={index} style={style}>{space}{word}</span>)
    }

    return renderArray;
}

export default Transcript;