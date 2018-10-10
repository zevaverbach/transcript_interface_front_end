import React, { Component } from 'react';
import MediaPlayer from './mediaPlayer';
import Transcript from './transcript';
import transcript from './transcript.json';


class InteractiveTranscript extends Component {
    state = {
        currentWordIndex: 0,
        transcript: transcript.words,
        playPosition: 0,
    }

    getNewWordIndex = newPosition => {
        let startAtSlice = this.state.currentWordIndex

        if (newPosition < this.state.playPosition) {
            startAtSlice = 0
        }

        for (let [index, wordObject] of Object.entries(this.state.transcript.slice(startAtSlice))) {

            let wordStart = parseFloat(wordObject.time)
            let wordEnd = wordStart + parseFloat(wordObject.duration)

            if (newPosition >= wordStart && newPosition <= wordEnd) {
                return parseInt(index) + startAtSlice
            }

        }
    }

    timeUpdate = newPosition => {
        const newWordIndex = this.getNewWordIndex(newPosition)
        if (newWordIndex) {
            this.setState({ currentWordIndex: newWordIndex })
            console.log(newWordIndex)
        }
    }

    render() {
        return <React.Fragment>
            <div>
                <MediaPlayer src={this.props.mediaSource} timeUpdate={this.timeUpdate} />
            </div>
            <div>
                <Transcript transcript={this.state.transcript} currentWordIndex={this.state.currentWordIndex} />
            </div>
        </React.Fragment>
    }
}

export default InteractiveTranscript;