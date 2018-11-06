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

    handleKeyDown = event => {
        switch (event.keyCode) {
            case 8:
                this.deleteWords();
                break;
            case 39:
                if (event.shiftKey) { // shift + left
                    this.increaseWordSelection();
                }
                break;
            case 37:
                if (event.shiftKey) { // shift + left
                    this.decreaseWordSelection();
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

    redo = () => this.undoRedo(1)
    undo = () => this.undoRedo(0)

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

        if (replaceUpToIndex && replaceUpToIndex < startIndex) {
            throw Error('replaceUpToIndex must be equal to or greater than startIndex')
        }

        const { transcript, undoQueue } = this.state

        // TODO: check if a given word is punctuation, and act accordingly:
        // wordStart and wordEnd are null
        // capitalization of next word after a period/question mark/exclamation
        // un-capitalization of next word if a period/q/ex is replaced with a non-terminating punc

        // TODO: refactor undo/redo to store 'types' of changes
        // this is in order to differentiate insertions and deletions from replacements

        const firstTranscriptChunk = transcript.slice(0, startIndex)

        const newWordsTemplate = this.wordAtIndex(startIndex)

        const insert = words.map((word, index) => {
            return {
                ...newWordsTemplate,
                confidence: 1.0,
                word,
                space: endsSentence(word) ? "" : " ",
                alwaysCapitalized: alwaysCapitalized(word),
                index: startIndex + index,
                key: startIndex + index,
            }
        })

        let lastTranscriptChunkStartAt = replaceUpToIndex ? replaceUpToIndex : startIndex
        let lastTranscriptChunkFirstIndex, indexModifier = 0, newUndoQueue

        if (insert.length === 0) {
            // for deletion
            lastTranscriptChunkStartAt++;
            lastTranscriptChunkFirstIndex = startIndex + 1;
            indexModifier = -1
            newUndoQueue = { delete: [transcript.slice(startIndex, replaceUpToIndex + 1)] }
        } else {
            lastTranscriptChunkFirstIndex = insert.slice(-1)[0].index + 1
            newUndoQueue = { insert: [insert] }
        }

        const lastTranscriptChunk = transcript.slice(lastTranscriptChunkStartAt).map((word, index) => ({
            ...word,
            index: lastTranscriptChunkFirstIndex + index + indexModifier,
            key: lastTranscriptChunkFirstIndex + index + indexModifier
        }))

        this.setState({
            transcript: firstTranscriptChunk.concat(insert).concat(lastTranscriptChunk),
            undoQueue: undoQueue.concat(newUndoQueue),
            redoQueue: [],
        })

        // if (isPunc(nextWord)) {
        //     thirdTranscriptChunk = transcript.slice(index + 2)
        // } else {
        //     thirdTranscriptChunk = transcript
        //         .slice(index + 1)
        //         .map(word => Object.assign(word, { index: word.index + 1 }))
        // }

        // const firstWordNextPhrase = thirdTranscriptChunk[0]

        // if (endsSentence(punc)
        //     && !isCapitalized(firstWordNextPhrase.word)
        //     && !firstWordNextPhrase.alwaysCapitalized) {

        //     thirdTranscriptChunk = [Object.assign(firstWordNextPhrase, {
        //         word: toTitleCase(firstWordNextPhrase.word),
        //         key: index + 2,
        //         index: index + 2,
        //         wordStart: nextWordStart,
        //     })]
        //         .concat(thirdTranscriptChunk.slice(1))
        // }

        // if (punc === ','
        //     && isCapitalized(firstWordNextPhrase.word)
        //     && !firstWordNextPhrase.alwaysCapitalized) {

        //     thirdTranscriptChunk = [Object.assign(firstWordNextPhrase, {
        //         word: firstWordNextPhrase.word.toLowerCase(),
        //         key: index + 2,
        //         index: index + 2,
        //         wordStart: nextWordStart,
        //     })]
        //         .concat(thirdTranscriptChunk.slice(1))
        // }

    }

    wordAtIndex = index => this.state.transcript[index]

    insertPuncAfterSelectedWords = punc => {

        const index = this.lastSelectedWordIndex()
        const nextWordObject = this.wordAtIndex(index + 1)
        const nextWord = nextWordObject.word
        if (nextWord === punc) return

        this.edit([punc], index + 1)
    }

    increaseWordSelection = () => {
        const { selectedWordIndices, transcript } = this.state
        const lastWordIndex = selectedWordIndices.start + selectedWordIndices.offset

        if (lastWordIndex === transcript.length) return

        this.setState({
            selectedWordIndices: {
                ...selectedWordIndices,
                offset: selectedWordIndices.offset + 1
            }
        })
    }

    decreaseWordSelection = () => {
        const { selectedWordIndices } = this.state

        const firstWordIndex = selectedWordIndices.start + selectedWordIndices.offset

        if (firstWordIndex === 0) return

        this.setState({
            selectedWordIndices: {
                ...selectedWordIndices,
                offset: selectedWordIndices.offset - 1
            }
        })
    }

    insertQueueStep = (transcript, step) => {

        let prevInsertLength = 0
        let newSelectedWordIndex

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

            newSelectedWordIndex = insertChunk.slice(-1)[0].index

        })

        return [transcript, newSelectedWordIndex]

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
            newSelectedWordIndex = indicesToRemove[0] - 1
        })
        return [transcript, newSelectedWordIndex]
    }

    undoRedo = whichOne => {
        let { redoQueue, undoQueue, transcript } = this.state
        const queue = whichOne ? redoQueue : undoQueue
        if (queue.length === 0) return

        const step = queue.slice(-1)[0]
        let newSelectedWordIndex

        // const nextWord = previousState[wordToRemove.index]
        // if (!nextWord.alwaysCapitalized && isCapitalized(nextWord.word) && endsSentence(wordToRemove.word)) {
        //     previousState = previousState.map(word => word === nextWord
        //         ? Object.assign(nextWord, { word: nextWord.word.toLowerCase() })
        //         : word)

        if (step.insert) {
            if (whichOne) {
                [transcript, newSelectedWordIndex] = this.insertQueueStep(transcript, step.insert)
            } else {
                [transcript, newSelectedWordIndex] = this.deleteQueueStep(transcript, step.insert)
            }
        }

        if (step.delete) {
            if (whichOne) {
                [transcript, newSelectedWordIndex] = this.deleteQueueStep(transcript, step.delete)
            } else {
                [transcript, newSelectedWordIndex] = this.insertQueueStep(transcript, step.delete)
            }
        }

        let queueState = {}
        if (whichOne) {
            queueState = {
                redoQueue: queue.slice(0, -1),
                undoQueue: undoQueue.concat(step),
            }
        } else {
            queueState = {
                undoQueue: queue.slice(0, -1),
                redoQueue: redoQueue.concat(step),
            }
        }

        console.log(queueState)

        this.setState({
            transcript,
            ...queueState,
            selectedWordIndices: {
                start: newSelectedWordIndex,
                offset: 0
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