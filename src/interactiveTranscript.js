import React, { Component } from 'react';
import MediaPlayer from './mediaPlayer';
import Transcript from './transcript';
import ConfidenceSlider from './confidenceSlider';
import transcript from './transcript.json';
import toTitleCase from './helpers'


class InteractiveTranscript extends Component {
    state = {
        currentWordIndex: 0,
        transcript: transcript.words.map((word, index) => (
            {
                wordStart: parseFloat(word.time),
                wordEnd: parseFloat(word.time) + parseFloat(word.duration),
                word: word.name,
                confidence: parseFloat(word.confidence),
                index: index,
                space: word.name === '.'
                    ? ''
                    : ' '
            }
        )),
        playPosition: 0,
        updatePlayer: false,
        confidenceThreshold: .5,
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyDown)
    }

    wordAtIndex = index => this.state.transcript[index]

    makeNewSentenceAfterCurrentWord = () => {
        const cwi = this.state.currentWordIndex;
        this.setState({
            transcript: (
                this.state.transcript.slice(0, cwi + 1)
                    .concat([{
                        wordStart: null,
                        wordEnd: null,
                        confidence: 1,
                        word: '.',
                        index: cwi + 1
                    }])
                    .concat([
                        Object.assign(this.state.transcript[cwi + 1], {
                            word: toTitleCase(this.state.transcript[cwi + 1].word),
                            index: this.state.transcript[cwi + 1].index + 1
                        })
                    ])
                    .concat(this.state.transcript.slice(cwi + 2)
                        .map(word => Object.assign(word, { index: word.index + 1 })))
            )
        })
    }

    addCommaAfterCurrentWord = () => {
        const cwi = this.state.currentWordIndex;
        this.setState({
            transcript: (
                this.state.transcript.slice(0, cwi + 1)
                    .concat([{
                        wordStart: null,
                        wordEnd: null,
                        confidence: 1,
                        word: ',',
                        index: cwi + 1,
                        space: false,
                    }])
                    .concat(this.state.transcript.slice(cwi + 1)
                        .map(word => Object.assign(word, { index: word.index + 1 })))
            )
        })
    }

    handleKeyDown = event => {
        switch (event.keyCode) {
            case 190:
                // period
                this.makeNewSentenceAfterCurrentWord()
                break;
            case 188:
                // comma
                this.addCommaAfterCurrentWord()
                break
            default:
                return
        }
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