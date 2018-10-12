import React, { Component } from 'react';
import MediaPlayer from './mediaPlayer';
import Transcript from './transcript';
// import ConfidenceSlider from './confidenceSlider';
import transcript from './transcript.json';
import { isPunc, toTitleCase, isCapitalized, endsSentence } from './helpers'


class InteractiveTranscript extends Component {

    state = {
        currentWordIndex: 0,
        transcript: transcript,
        playPosition: 0,
        play: false,
        updatePlayer: false,
        confidenceThreshold: .5,
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyDown)
    }

    wordAtIndex = index => this.state.transcript[index]

    insertPuncAfterCurrentWord = punc => {

        const index = this.state.currentWordIndex;
        const nextWordObject = this.state.transcript[index + 1]
        const nextWordStart = nextWordObject.wordStart
        const nextWord = nextWordObject.word
        if (nextWord === punc) return

        // entire transcript up to and including the currently selected word
        const firstTranscriptChunk = this.state.transcript.slice(0, index + 1)

        const punctuationChunk = [{
            wordStart: null,
            wordEnd: null,
            confidence: 1,
            word: punc,
            index: index + 1
        }]

        let thirdTranscriptChunk = []

        if (isPunc(nextWord)) {
            thirdTranscriptChunk = this.state.transcript.slice(index + 2)
        } else {
            thirdTranscriptChunk = this.state.transcript.slice(index + 1).map(word => Object.assign(word, { index: word.index + 1 }))
        }

        const firstWordNextPhrase = thirdTranscriptChunk[0]

        if (endsSentence(punc)
            && !isCapitalized(firstWordNextPhrase.word)
            && !firstWordNextPhrase.alwaysCapitalized) {
            thirdTranscriptChunk = [Object.assign(firstWordNextPhrase, {
                word: toTitleCase(firstWordNextPhrase.word),
                key: index + 2,
                index: index + 2,
                wordStart: nextWordStart,
            })].concat(thirdTranscriptChunk.slice(1))
        }

        if (punc === ','
            && isCapitalized(firstWordNextPhrase.word)
            && !firstWordNextPhrase.alwaysCapitalized) {
            thirdTranscriptChunk = [Object.assign(firstWordNextPhrase, {
                word: firstWordNextPhrase.word.toLowerCase(),
                key: index + 2,
                index: index + 2,
                wordStart: nextWordStart,
            })].concat(thirdTranscriptChunk.slice(1))
        }

        this.setState({
            transcript: firstTranscriptChunk.concat(punctuationChunk).concat(thirdTranscriptChunk)
        })
    }


    handleKeyDown = event => {
        switch (event.keyCode) {
            case 190: // period
                this.insertPuncAfterCurrentWord('.')
                break;
            case 188: // comma
                this.insertPuncAfterCurrentWord(',')
                break
            case 191: // question mark (or slash)
                this.insertPuncAfterCurrentWord('?')
                break
            case 9: // tab
                event.preventDefault()
                if (event.shiftKey) {
                    this.goToPreviousWord();
                } else {
                    this.goToNextWord()
                }
                break
            case 186: // colon
                if (event.shiftKey) this.insertPuncAfterCurrentWord(':')
                break
            default:
                return
        }
    }

    goToNextWord = () => {
        if (this.state.currentWordIndex < this.state.transcript.length) {
            let numWordsForward = 1
            let selectedWord = this.state.transcript[this.state.currentWordIndex + numWordsForward]
            while (selectedWord.wordStart === null) {
                numWordsForward++;
                selectedWord = this.state.transcript[this.state.currentWordIndex + numWordsForward]
            }

            this.setState({
                currentWordIndex: this.state.currentWordIndex + numWordsForward,
                playPosition: selectedWord.wordStart,
                updatePlayer: true
            })
        }
    }
    goToPreviousWord = () => {
        if (this.state.currentWordIndex > 0) {
            let numWordsBack = 1
            let selectedWord = this.state.transcript[this.state.currentWordIndex - numWordsBack]
            while (selectedWord.wordStart === null) {
                numWordsBack++;
                selectedWord = this.state.transcript[this.state.currentWordIndex - numWordsBack]
            }

            this.setState({
                currentWordIndex: this.state.currentWordIndex - numWordsBack,
                playPosition: selectedWord.wordStart,
                updatePlayer: true
            })
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

    onClickWord = word => this.setState({
        playPosition: word.wordStart,
        currentWordIndex: word.index,
        updatePlayer: true,
    })

    handleConfidenceThresholdChange = confidenceThreshold => this.setState({ confidenceThreshold })

    render() {
        return (
            <React.Fragment>
                <div>
                    <MediaPlayer
                        src={this.props.mediaSource}
                        onTimeUpdate={this.onTimeUpdate}
                        updatePlayer={this.state.updatePlayer}
                        playPosition={this.state.playPosition}
                        play={this.state.play}
                    />

                </div>
                {/* <div>
                    <ConfidenceSlider onChange={this.handleConfidenceThresholdChange} />
                    <span>ASR Confidence Threshold: {(this.state.confidenceThreshold * 100).toPrecision(2)}%</span>
                </div> */}
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