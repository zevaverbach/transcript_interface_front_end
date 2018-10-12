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

    makeNewSentenceAfterCurrentWord = char => {
        const index = this.state.currentWordIndex;
        const nextWord = this.state.transcript[index + 1].word
        if (nextWord === char) return
        if (['.', '?'].includes(nextWord)) {
            this.setState({
                transcript: (
                    this.state.transcript.slice(0, index + 1)
                        .concat([{
                            wordStart: null,
                            wordEnd: null,
                            confidence: 1,
                            word: char,
                            index: index + 1
                        }])
                        .concat(this.state.transcript.slice(index + 2))
                )
            })
        } else {
            this.setState({
                transcript: (
                    this.state.transcript.slice(0, index + 1)
                        .concat([{
                            wordStart: null,
                            wordEnd: null,
                            confidence: 1,
                            word: char,
                            index: index + 1
                        }])
                        .concat([
                            Object.assign(this.state.transcript[index + 1], {
                                word: toTitleCase(this.state.transcript[index + 1].word),
                                index: this.state.transcript[index + 1].index + 1
                            })
                        ])
                        .concat(this.state.transcript.slice(index + 2)
                            .map(word => Object.assign(word, { index: word.index + 1 })))
                )
            })
        }
    }

    addCommaAfterCurrentWord = () => {
        const index = this.state.currentWordIndex;
        const nextWord = this.state.transcript[index + 1].word
        if (nextWord === ',') return
        if (['.', '?'].includes(nextWord)) {
            this.setState({
                transcript: (
                    this.state.transcript.slice(0, index + 1)
                        .concat([{
                            wordStart: null,
                            wordEnd: null,
                            confidence: 1,
                            word: ',',
                            index: index + 1
                        }])
                        .concat([
                            Object.assign(this.state.transcript[index + 1], {
                                word: this.state.transcript[index + 1].word.toLowerCase(),
                                index: this.state.transcript[index + 1].index + 1
                            })
                        ])
                        .concat(this.state.transcript.slice(index + 2))
                )
            })
        } else {
            this.setState({
                transcript: (
                    this.state.transcript.slice(0, index + 1)
                        .concat([{
                            wordStart: null,
                            wordEnd: null,
                            confidence: 1,
                            word: ',',
                            index: index + 1,
                            space: false,
                        }])
                        .concat(this.state.transcript.slice(index + 1)
                            .map(word => Object.assign(word, { index: word.index + 1 })))
                )
            })
        }
    }

    handleKeyDown = event => {
        switch (event.keyCode) {
            case 190:
                // period
                this.makeNewSentenceAfterCurrentWord('.')
                break;
            case 188:
                // comma
                this.addCommaAfterCurrentWord()
                break
            case 191:
                // question mark (or slash)
                this.makeNewSentenceAfterCurrentWord('?')
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

    onTimeUpdate = newPosition => {
        const newWordIndex = this.getNewWordIndex(newPosition)
        if (newWordIndex) {
            this.setState({ currentWordIndex: newWordIndex })
        }
    }

    onClickWord = word => this.setState({ playPosition: word.wordStart, currentWordIndex: word.index, updatePlayer: true })
    handleConfidenceThresholdChange = confidenceThreshold => this.setState({ confidenceThreshold })
    setUpdatePlayerFalse = () => this.setState({ updatePlayer: false })

    render() {
        console.log(this.state.currentWordIndex)
        return (
            <React.Fragment>
                <div>
                    <MediaPlayer
                        src={this.props.mediaSource}
                        onTimeUpdate={this.onTimeUpdate}
                        updatePlayer={this.state.updatePlayer}
                        playPosition={this.state.playPosition}
                        setUpdatePlayerFalse={this.setUpdatePlayerFalse}
                    />

                </div>
                <div>
                    <ConfidenceSlider onChange={this.handleConfidenceThresholdChange} />
                    <span>ASR Confidence Threshold: {(this.state.confidenceThreshold * 100).toPrecision(2)}%</span>
                </div>
                <div>
                    <Transcript
                        transcript={this.state.transcript}
                        currentWordIndex={this.state.currentWordIndex}
                        confidenceThreshold={this.state.confidenceThreshold}
                        onClickWord={this.onClickWord}
                    />
                </div>
            </React.Fragment>
        )
    }
}

export default InteractiveTranscript;