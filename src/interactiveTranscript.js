import React, { Component } from 'react';
import MediaPlayer from './mediaPlayer';
import Transcript from './transcript';
import transcript from './transcript.json';
import { isPunc, toTitleCase, isCapitalized, endsSentence } from './helpers'


class InteractiveTranscript extends Component {

    state = {
        currentWordIndex: 0,
        transcript: transcript,
        undoQueue: [],
        redoQueue: [],
        playPosition: 0,
        play: false,
        updatePlayer: false,
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

        this.setState({
            undoQueue: this.state.undoQueue.concat(punctuationChunk)
        })


        let thirdTranscriptChunk = []

        if (isPunc(nextWord)) {
            thirdTranscriptChunk = this.state.transcript.slice(index + 2)
        } else {
            thirdTranscriptChunk = this.state.transcript
                .slice(index + 1)
                .map(word => Object.assign(word, { index: word.index + 1 }))
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
            })]
                .concat(thirdTranscriptChunk.slice(1))
        }

        if (punc === ','
            && isCapitalized(firstWordNextPhrase.word)
            && !firstWordNextPhrase.alwaysCapitalized) {

            thirdTranscriptChunk = [Object.assign(firstWordNextPhrase, {
                word: firstWordNextPhrase.word.toLowerCase(),
                key: index + 2,
                index: index + 2,
                wordStart: nextWordStart,
            })]
                .concat(thirdTranscriptChunk.slice(1))
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
            case 222:
                if (event.metaKey && event.ctrlKey) { // ctrl + meta + '
                    this.goToPreviousPhrase();
                }
                break
            case 186:
                if (event.metaKey && event.ctrlKey) { // ctrl + meta + ;
                    this.goToNextPhrase();
                } else { // colon
                    if (event.shiftKey) this.insertPuncAfterCurrentWord(':')
                }
                break
            case 90:
                if (event.metaKey && event.shiftKey) { // meta + shift + z
                    event.preventDefault()
                    this.redo()
                } else if (event.metaKey) { // meta + z
                    event.preventDefault()
                    this.undo()
                }
                break
            default:
                return
        }
    }

    undo = () => {
        if (this.state.undoQueue.length > 0) {
            const wordToRemove = this.state.undoQueue.slice(-1)[0]
            let previousState = this.state.transcript
                .filter(word => word.index !== wordToRemove.index)
                .map(word => word.index > wordToRemove.index ? Object.assign(word, { index: word.index - 1 }) : word)

            const nextWord = previousState[wordToRemove.index]
            if (!nextWord.alwaysCapitalized && isCapitalized(nextWord.word) && endsSentence(wordToRemove.word)) {
                previousState = previousState.map(word => word === nextWord
                    ? Object.assign(nextWord, { word: nextWord.word.toLowerCase() })
                    : word)
            }

            this.setState({
                transcript: previousState,
                undoQueue: this.state.undoQueue.slice(0, -1),
                redoQueue: this.state.redoQueue.concat(wordToRemove)
            })
        }
    }

    redo = () => {
        if (this.state.redoQueue.length > 0) {
            const wordToAdd = this.state.redoQueue.slice(-1)[0]

            let previousState = this.state.transcript
            previousState = previousState
                .map(word => word.index >= wordToAdd.index ? Object.assign(word, { index: word.index + 1 }) : word)
            previousState.splice(wordToAdd.index, 0, wordToAdd)

            const nextWord = previousState[wordToAdd.index + 1]
            console.log(nextWord)
            if (endsSentence(wordToAdd.word) && !isCapitalized(nextWord.word)) {
                previousState = previousState.map(word => word === nextWord
                    ? Object.assign(nextWord, { word: toTitleCase(nextWord.word) })
                    : word)
            }


            this.setState({
                transcript: previousState,
                redoQueue: this.state.redoQueue.slice(0, -1),
                undoQueue: this.state.undoQueue.concat(wordToAdd)
            })
        }
    }

    findClosestPunctuation = (nextPrev) => {

        let iterateOn = []

        if (nextPrev === 'next') {
            iterateOn = this.state.transcript.slice(this.state.currentWordIndex + 1)
        } else {
            iterateOn = this.state.transcript.slice(0, this.state.currentWordIndex - 1).reverse()
        }
        for (let word of iterateOn) {
            if (isPunc(word.word)) {
                // prevent iterating past the beginning and back to the end when searching for previous
                if (nextPrev === 'previous' && word.index > this.state.currentWordIndex) return 0
                return word.index
            }
        }
        if (nextPrev === 'previous') return 0; // hack to get back to the beginning when searching for previous
    }

    goToNextPhrase = () => {
        const nextPunctuationIndex = this.findClosestPunctuation('next')
        if (nextPunctuationIndex !== null && nextPunctuationIndex < this.state.transcript.length - 1) {
            this.setState({
                currentWordIndex: nextPunctuationIndex + 1,
                playPosition: this.state.transcript[nextPunctuationIndex + 1].wordStart,
                updatePlayer: true
            })
        }
    }

    goToPreviousPhrase = () => {
        let previousPunctuationIndex = this.findClosestPunctuation('previous')
        if (previousPunctuationIndex === 0) previousPunctuationIndex = -1
        if (previousPunctuationIndex) {
            this.setState({
                currentWordIndex: previousPunctuationIndex + 1,
                playPosition: this.state.transcript[previousPunctuationIndex + 1].wordStart,
                updatePlayer: true
            })
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
                updatePlayer: true,
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
        if (newPosition === this.state.playPosition) return
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
                <div>
                    <Transcript
                        transcript={this.state.transcript}
                        currentWordIndex={this.state.currentWordIndex}
                        onClickWord={this.onClickWord}
                    />
                </div>
            </React.Fragment>
        )
    }
}

export default InteractiveTranscript;