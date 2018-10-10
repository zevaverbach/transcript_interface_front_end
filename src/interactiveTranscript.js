import React, { Component } from 'react';
import MediaPlayer from './mediaPlayer';
import Transcript from './transcript';
import ConfidenceSlider from './confidenceSlider';
import transcript from './transcript.json';


class InteractiveTranscript extends Component {
    state = {
        currentWordIndex: 0,
        transcript: transcript.words.map((word, index) => {
            return {
                wordStart: parseFloat(word.time),
                wordEnd: parseFloat(word.time) + parseFloat(word.duration),
                word: word.name,
                confidence: parseFloat(word.confidence),
                index: index,
            }
        }),
        playPosition: 0,
        updatePlayer: false,
        confidenceThreshold: 0,
    }

    getNewWordIndex = newPosition => {

        for (let wordObject of this.state.transcript) {

            if (newPosition >= wordObject.wordStart && newPosition <= wordObject.wordEnd) {
                return wordObject.index
            }

        }
    }

    timeUpdate = newPosition => {
        const newWordIndex = this.getNewWordIndex(newPosition)
        if (newWordIndex) {
            this.setState({ currentWordIndex: newWordIndex })
        }
    }

    onClickWord = timeString => {
        this.setState({ playPosition: parseFloat(timeString), updatePlayer: true })
    }

    onConfidenceChange = confidencePercent => this.setState({ confidenceThreshold: confidencePercent })

    render() {
        return <React.Fragment>
            <div>
                <MediaPlayer
                    src={this.props.mediaSource}
                    timeUpdate={this.timeUpdate}
                    updatePlayer={this.state.updatePlayer}
                    currentTime={this.state.playPosition} />
            </div>
            <div>
                <ConfidenceSlider onChange={this.onConfidenceChange} />
                <span>ASR Confidence Threshold: {(this.state.confidenceThreshold * 100).toPrecision(2)}%</span>
            </div>
            <div>
                <Transcript transcript={this.state.transcript}
                    currentWordIndex={this.state.currentWordIndex}
                    confidenceThreshold={this.state.confidenceThreshold}
                    onClickWord={this.onClickWord} />
            </div>
        </React.Fragment>
    }
}

export default InteractiveTranscript;