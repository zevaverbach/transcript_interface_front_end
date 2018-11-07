import React, { Component } from 'react';
import MediaPlayer from './mediaPlayer';
import Transcript from './transcript';
import transcript from './transcript.json';
import { isPunc, toTitleCase, isCapitalized, endsSentence, alwaysCapitalized } from './helpers'


class InteractiveTranscript extends Component {

    state = {
        selectedWordIndices: {
            start: 0,
            offset: 0
        },
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

    handleKeyDown = event => {
        switch (event.keyCode) {
            case 8:
                this.deleteWords();
                break;
            case 39:
                if (event.shiftKey) { // shift + left
                    this.selectWords('increase');
                } else {
                    this.goToNextWord();
                }
                break;
            case 37:
                if (event.shiftKey) { // shift + left
                    this.selectWords('decrease');
                } else {
                    this.goToPreviousWord();
                }
                break;
            // case 13: // enter
            //     this.edit();
            //     break;
            case 190: // period
                this.insertPuncAfterSelectedWords('.')
                break;
            case 188: // comma
                this.insertPuncAfterSelectedWords(',')
                break
            case 191: // question mark (or slash)
                this.insertPuncAfterSelectedWords('?')
                break
            case 49: // exclamation point
                if (event.shiftKey) {
                    this.insertPuncAfterSelectedWords('!')
                }
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
                } else if (!event.altKey) {
                    this.surroundSelectionWithQuotes();
                }
                break
            case 186:
                if (event.metaKey && event.ctrlKey) { // ctrl + meta + ;
                    this.goToNextPhrase();
                } else { // colon
                    if (event.shiftKey) this.insertPuncAfterSelectedWords(':')
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

    redo = () => this.undoRedoEdit('redo')
    undo = () => this.undoRedoEdit('undo')

    firstSelectedWordIndex = () => {
        const { selectedWordIndices } = this.state
        const { offset, start } = selectedWordIndices
        return offset < 0 ? start + offset : start
    }

    lastSelectedWordIndex = () => {
        const { selectedWordIndices } = this.state
        const { offset, start } = selectedWordIndices
        return offset > 0 ? start + offset : start
    }

    selectedWords = () => this.transcript.slice(this.firstSelectedWordIndex(), this.lastSelectedWordIndex() + 1)

    surroundSelectionWithQuotes = () => {
        console.log(this.firstSelectedWordIndex())
        console.log(this.lastSelectedWordIndex())
        this.edit(['"'], this.firstSelectedWordIndex())
        this.edit(['"'], this.lastSelectedWordIndex() + 1)
    }

    deleteWords = () => {
        this.edit(
            [],
            this.firstSelectedWordIndex(),
            this.lastSelectedWordIndex()
        )
    }

    edit = (words, startIndex, replaceUpToIndex = false) => {

        const { transcript } = this.state
        const newWordsTemplate = this.wordAtIndex(startIndex)
        const edits = {}

        if (words.length > 0) {
            edits.insert = [words.map((word, index) => ({
                ...newWordsTemplate,
                confidence: 1.0,
                word,
                space: endsSentence(word) ? "" : " ",
                alwaysCapitalized: alwaysCapitalized(word),
                index: startIndex + index,
                key: startIndex + index,
            }))]
        }

        if (replaceUpToIndex) {
            // define this
            edits.delete = [transcript.slice(startIndex, replaceUpToIndex + 1)]
        }

        this.undoRedoEdit('edit', edits)

    }

    insertQueueStep = (transcript, step) => {

        let prevInsertLength = 0
        let newSelectedWords

        step.forEach(insertChunk => {
            const numWords = insertChunk.length

            transcript = transcript
                .slice(0, insertChunk[0].index + prevInsertLength)
                .concat(insertChunk
                    .map(word => ({
                        ...word,
                        index: word.index + prevInsertLength,
                        key: word.index + prevInsertLength
                    })))
                .concat(transcript.slice(insertChunk[0].index + prevInsertLength)
                    .map(word => ({
                        ...word,
                        index: word.index + numWords,
                        key: word.index + numWords
                    })))

            prevInsertLength = numWords

            let newSelectedWordsStartOffset = numWords - 1

            if (numWords === 1 && isPunc(insertChunk[0].word)) {
                newSelectedWordsStartOffset = -1
            }


            const newSelectedWordIndex = insertChunk.slice(-1)[0].index - newSelectedWordsStartOffset

            newSelectedWords = {
                start: newSelectedWordIndex,
                offset: numWords - 1
            }

        })

        return [transcript, newSelectedWords]

    }

    deleteQueueStep = (transcript, step) => {

        let prevDeleteLength = 0
        let newSelectedWordIndex

        step.forEach(deleteChunk => {
            const numWords = deleteChunk.length
            const indicesToRemove = Array(numWords).fill()
                .map((_, i) => deleteChunk[0].index - prevDeleteLength + i)

            transcript = transcript
                .filter(word => !indicesToRemove.includes(word.index))
                .map(word => word.index > indicesToRemove[0]
                    ? {
                        ...word,
                        index: word.index - numWords
                    }
                    : word)

            prevDeleteLength = numWords
            newSelectedWordIndex = indicesToRemove[0]
        })
        return [transcript, { start: newSelectedWordIndex, offset: 0 }]
    }

    undoRedoEdit = (whichOne, edit = false) => {
        let { redoQueue, undoQueue, transcript } = this.state
        let queue, step, selectedWordIndices

        if (edit) {
            queue = null
            step = edit
        }

        if (whichOne === 'undo') {
            queue = undoQueue
        } else if (whichOne === 'redo') {
            queue = redoQueue
        }

        if (queue) {
            if (queue.length === 0) return
            step = queue.slice(-1)[0]
        }

        if (step.insert) {
            if (whichOne === 'undo') {
                [transcript, selectedWordIndices] = this.deleteQueueStep(transcript, step.insert)
            } else {
                [transcript, selectedWordIndices] = this.insertQueueStep(transcript, step.insert)
            }
        }

        if (step.delete) {
            if (whichOne === 'undo') {
                [transcript, selectedWordIndices] = this.insertQueueStep(transcript, step.delete)
            } else {
                [transcript, selectedWordIndices] = this.deleteQueueStep(transcript, step.delete)
            }
        }

        let queueState = {}
        if (whichOne === 'undo') {
            queueState = {
                undoQueue: queue.slice(0, -1),
                redoQueue: redoQueue.concat(step),
            }
        } else if (whichOne === 'redo') {
            queueState = {
                redoQueue: queue.slice(0, -1),
                undoQueue: undoQueue.concat(step),
            }
        } else {
            queueState = {
                undoQueue: undoQueue.concat(step)
            }
        }

        this.setState({
            transcript,
            ...queueState,
            selectedWordIndices
        })

    }

    insertPuncAfterSelectedWords = punc => {

        const index = this.lastSelectedWordIndex()
        let startIndex = index + 1
        let replaceUpToIndex = false
        let nextWordObject = this.wordAtIndex(startIndex)
        if (nextWordObject) {
            const nextWord = nextWordObject.word
            if (nextWord === punc) return
        } else {
            // punctuation at end of selection, so replace it
            startIndex = index
            replaceUpToIndex = index
        }
        this.edit([punc], startIndex, replaceUpToIndex)
    }

    selectWords = whichOne => {
        const { selectedWordIndices, transcript } = this.state
        const firstOrLastWordIndex = selectedWordIndices.start + selectedWordIndices.offset

        if ((whichOne === 'increase' && firstOrLastWordIndex === transcript.length)
            || (whichOne === 'decrease' && firstOrLastWordIndex === 0)) return

        const offset = whichOne === 'increase' ? 1 : -1

        this.setState({
            selectedWordIndices: {
                ...selectedWordIndices,
                offset: selectedWordIndices.offset + offset
            }
        })

    }

    findClosestPunctuation = (nextPrev) => {

        const { transcript, selectedWordIndices } = this.state

        let iterateOn = []

        if (nextPrev === 'next') {
            iterateOn = transcript.slice(selectedWordIndices.start + selectedWordIndices.offset + 1)
        } else {
            iterateOn = transcript.slice(0, selectedWordIndices.start - 1).reverse()
        }
        for (let word of iterateOn) {
            if (isPunc(word.word)) {
                // prevent iterating past the beginning and back to the end when searching for previous
                if (nextPrev === 'previous' && word.index > selectedWordIndices.start) return 0
                return word.index
            }
        }
        if (nextPrev === 'previous') return 0; // hack to get back to the beginning when searching for previous
    }

    goToNextPhrase = () => {
        const { transcript } = this.state
        const nextPunctuationIndex = this.findClosestPunctuation('next')
        if (nextPunctuationIndex !== null && nextPunctuationIndex < transcript.length - 1) {
            this.setState({
                selectedWordIndices: {
                    start: nextPunctuationIndex + 1,
                    offset: 0,
                },
                playPosition: this.wordAtIndex(nextPunctuationIndex + 1).wordStart,
                updatePlayer: true
            })
        }
    }

    goToPreviousPhrase = () => {
        let previousPunctuationIndex = this.findClosestPunctuation('previous')
        if (previousPunctuationIndex === 0) previousPunctuationIndex = -1
        if (previousPunctuationIndex) {
            const playPosition = this.wordAtIndex(previousPunctuationIndex + 1).wordStart
            this.setState({
                selectedWordIndices: {
                    start: previousPunctuationIndex + 1,
                    offset: 0,
                },
                playPosition: playPosition - (Math.random() * .1),
                updatePlayer: true
            })
        }
    }

    goToNextWord = () => {
        const { transcript, selectedWordIndices } = this.state
        let transcriptLength = transcript.length;
        if (isPunc(this.wordAtIndex(transcriptLength - 1).word)) transcriptLength--;
        let lastWordIndex;
        if (selectedWordIndices.offset > 1) {
            lastWordIndex = selectedWordIndices.start + selectedWordIndices.offset
        } else {
            lastWordIndex = selectedWordIndices.start
        }

        if (lastWordIndex + 1 < transcriptLength) {
            let selectedWordIndex = lastWordIndex + 1
            let selectedWord = this.wordAtIndex(selectedWordIndex)
            while (selectedWordIndex < transcriptLength && selectedWord.wordStart === null) {
                selectedWord = this.wordAtIndex(selectedWordIndex)
                selectedWordIndex++;
            }

            this.setState({
                selectedWordIndices: {
                    start: selectedWordIndex,
                    offset: 0,
                },
                playPosition: selectedWord.wordStart,
                updatePlayer: true,
            })
        }
    }

    goToPreviousWord = () => {
        const { selectedWordIndices } = this.state
        let firstWordIndex;
        if (selectedWordIndices.offset < 0) {
            firstWordIndex = selectedWordIndices.start + selectedWordIndices.offset
        } else {
            firstWordIndex = selectedWordIndices.start
        }

        if (firstWordIndex === 0) return;

        let selectedWordIndex = firstWordIndex - 1
        let selectedWord = this.wordAtIndex(selectedWordIndex)
        while (selectedWordIndex !== 0 && selectedWord.wordStart === null) {
            selectedWordIndex--;
            selectedWord = this.wordAtIndex(selectedWordIndex)
        }

        this.setState({
            selectedWordIndices: {
                start: selectedWordIndex,
                offset: 0,
            },
            playPosition: selectedWord.wordStart,
            updatePlayer: true,
        })
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
            this.setState({
                selectedWordIndices: {
                    start: newWordIndex,
                    offset: 0,
                },
            })
        }
    }

    onClickWord = word => this.setState({
        playPosition: word.wordStart + Math.random() * .1,
        selectedWordIndices: {
            start: word.index,
            offset: 0,
        },
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
                        selectedWordIndices={this.state.selectedWordIndices}
                        onClickWord={this.onClickWord}
                    />
                </div>
            </React.Fragment >
        )
    }
}

export default InteractiveTranscript;