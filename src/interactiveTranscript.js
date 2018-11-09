import React, { Component } from 'react';
import MediaPlayer from './mediaPlayer';
import Transcript from './transcript';
import transcript from './transcript.json';
import { removeSelection, isPunc, isPhraseDelimiter } from './helpers'
import { style } from './App.css'



class InteractiveTranscript extends Component {

    constructor() {
        super()
        this.editModal = React.createRef()
    }

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
        showEditModal: false,
        editingWords: [],
        editModalEdited: false,
        editModalStyle: { width: window.innerWidth },
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyDown)
    }

    wordAtIndex = index => this.state.transcript[index]

    // getOffsetsOfWordAtIndex = index => {
    //     // TODO: support multiple indices, or make a separate method for that
    //     const span = document.querySelectorAll('span.word')[index]
    //     console.log(span)
    //     return {
    //         x: span.offsetLeft,
    //         y: span.offsetTop,
    //         width: span.offsetWidth,
    //         height: span.offsetHeight,
    //     }
    // }

    onInputModalChange = event => {
        this.setState({
            editModalEdited: true,
            editingWords: event.target.value,
            // editModalStyle: {
            //     width: this.editModal.current.scrollWidth
            // }
        })
    }

    onInputModalKeyUp = event => {
        if (event.keyCode === 13) {
            this.setState({
                editModalEdited: false
            })
            // this.undoRedoEdit
        }
    }

    renderEditModal() {
        const { editingWords } = this.state
        const words = this.selectedWords().map(word => word.word).join(' ')

        return (
            <div className='modal'>
                <div className='modal-main'>
                    <input
                        ref={this.editModal}
                        style={this.state.editModalStyle}
                        onChange={this.onInputModalChange}
                        onKeyUp={this.onInputModalKeyUp}
                        autoFocus
                        onFocus={(event) => { document.execCommand('selectall') }}
                        value={editingWords}>
                    </input>
                </div>
            </div>
        )
    }

    redo = () => this.undoRedoEdit('redo')
    undo = () => this.undoRedoEdit('undo')

    getSelectedWordIndex = firstLast => {
        const { selectedWordIndices } = this.state
        const { offset, start } = selectedWordIndices
        if (firstLast === 'first') {
            return offset < 0 ? start + offset : start
        }
        return offset > 0 ? start + offset : start
    }

    selectedWords = () => this.state.transcript.slice(
        this.getSelectedWordIndex('first'),
        this.getSelectedWordIndex('last') + 1)

    surroundSelectionWithStuff = stuff => {

        this.undoRedoEdit('edit',
            {
                selectedWords: this.getSelectedWordsObject(1),
                insert: [
                    [
                        {
                            "wordStart": null,
                            "wordEnd": null,
                            "confidence": 1.0,
                            "word": stuff,
                            "alwaysCapitalized": false,
                            "index": this.getSelectedWordIndex('first'),
                        }
                    ],
                    [
                        {
                            "wordStart": null,
                            "wordEnd": null,
                            "confidence": 1.0,
                            "word": stuff,
                            "alwaysCapitalized": false,
                            "index": this.getSelectedWordIndex('last') + 1,
                        },
                    ],
                ],
            }
        )
    }

    deleteWords = () => {

        this.undoRedoEdit('edit',
            {
                selectedWords: this.getSelectedWordsObject(),
                delete: [this.selectedWords()]
            },
        )
    }

    insertQueueStep = (transcript, step) => {

        let prevInsertLength = 0,
            newSelectedWords, newSelectedWordIndex

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

            let newSelectedWordsStartOffset = numWords - 1

            if (numWords === 1 && isPunc(insertChunk[0].word)) {
                newSelectedWordsStartOffset = -1
            }

            newSelectedWordIndex = insertChunk.slice(-1)[0].index - newSelectedWordsStartOffset

            newSelectedWords = {
                start: newSelectedWordIndex,
                offset: numWords - 1
            }

            prevInsertLength = numWords

        })

        return [transcript, newSelectedWords]

    }

    deleteQueueStep = (transcript, step) => {

        let prevDeleteLength = 0, newSelectedWords
        let lastIndexDeleted = step[0][0].index

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

            // only adjust indicesToRemove if the deletions are next to each other: to fix bug in surroundWithStuff
            if (indicesToRemove[0] - lastIndexDeleted === 1) prevDeleteLength = numWords

            newSelectedWords = { start: indicesToRemove[0] - 1, offset: numWords - 1 }

            lastIndexDeleted = indicesToRemove.slice(-1)[0]
        })
        return [transcript, newSelectedWords]
    }

    undoRedoEdit = (whichOne, edit = false) => {

        // 'edit' value for whichOne is handled in the same places as 'redo'
        if (!['edit', 'undo', 'redo'].includes(whichOne)) throw Error('invalid argument for `whichOne`.')

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
            // edit
            queueState = {
                undoQueue: undoQueue.concat(step),
                redoQueue: [],
            }
        }

        if (step.selectedWords) {
            if (whichOne === 'undo' && step.insert && step.insert.length > 1) {
                selectedWordIndices = {
                    ...step.selectedWords,
                    start: step.selectedWords.start - 1
                }
            } else {
                selectedWordIndices = step.selectedWords
            }
        }

        this.setState({
            transcript,
            ...queueState,
            selectedWordIndices
        })

    }

    getSelectedWordsObject = (increment = 0) => {
        const firstWordIndex = this.getSelectedWordIndex('first') + increment
        const lastWordIndex = this.getSelectedWordIndex('last') + increment

        return {
            start: firstWordIndex,
            offset: lastWordIndex - firstWordIndex
        }
    }

    insertPuncAfterSelectedWords = punc => {

        const index = this.getSelectedWordIndex('last')
        let startIndex = index + 1

        const nextWordObject = this.wordAtIndex(startIndex)

        if (!nextWordObject) return
        if (nextWordObject.word === punc) return

        const lastSelectedWord = this.wordAtIndex(index)

        if (isPhraseDelimiter(lastSelectedWord.word)) {
            return
            // this.setState({
            //     selectedWordIndices: {
            //         ...this.state.selectedWordIndices,
            //         offset: this.state.selectedWordIndices.offset - 1
            //     }
            // })
            // return this.insertPuncAfterSelectedWords(punc)
        }

        const edit = {
            selectedWords: this.getSelectedWordsObject(),
            insert: [
                [
                    {
                        "wordStart": null,
                        "wordEnd": null,
                        "confidence": 1.0,
                        "word": punc,
                        "alwaysCapitalized": false,
                        "index": startIndex
                    }
                ]
            ],
        }

        if (isPhraseDelimiter(nextWordObject.word)) {
            edit.insert[0][0].index++
            edit.delete = [
                [
                    this.state.transcript[startIndex]
                ]
            ]

        }

        this.undoRedoEdit('edit', edit)

        if (isPhraseDelimiter(nextWordObject.word)) {
            const { undoQueue } = this.state
            console.log(undoQueue)
            // const undoHead = undoQueue.slice(0, -1)
            // const lastUndo = undoQueue.slice(-1)[0]


            const newState = {
                undoQueue: Object.entries(undoQueue).forEach(([k, v]) => {

                })

            }
            // undoQueue: undoHead.concat([{
            //     ...lastUndo,
            //     insert: [lastUndo.insert.concat({
            //         ...lastUndo.insert[0][0],
            //         index: lastUndo.insert[0][0].index - 1
            //     })]
            // }])

            this.setState(newState)
            console.log(undoQueue)
        }
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

    findClosestPunctuation = nextPrev => {

        const { transcript, selectedWordIndices } = this.state

        let iterateOn = []

        if (nextPrev === 'next') {
            iterateOn = transcript.slice(selectedWordIndices.start + selectedWordIndices.offset + 1)
        } else {
            iterateOn = transcript.slice(0, selectedWordIndices.start - 1).reverse()
        }
        for (let word of iterateOn) {
            if (isPhraseDelimiter(word.word)) {
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
        const { play, playPosition, updatePlayer,
            transcript, selectedWordIndices, showEditModal } = this.state

        return (
            <React.Fragment>
                <div>
                    <MediaPlayer
                        src={this.props.mediaSource}
                        onTimeUpdate={this.onTimeUpdate}
                        updatePlayer={updatePlayer}
                        playPosition={playPosition}
                        play={play}
                    />

                </div>
                {showEditModal && this.renderEditModal()}
                <div id='transcript'>
                    <Transcript
                        transcript={transcript}
                        selectedWordIndices={selectedWordIndices}
                        onClickWord={this.onClickWord}
                    />
                </div>
            </React.Fragment >
        )
    }
    handleKeyDown = event => {

        const { showEditModal } = this.state

        switch (event.keyCode) {
            case 13: // enter
                if (!showEditModal) this.setState({ showEditModal: true })
                break;
            case 32: // spacebar
                if (!showEditModal) this.setState({ showEditModal: true })
                break;

            case 27: // escape
                if (showEditModal) {
                    this.setState({ showEditModal: false })
                    if (window.getSelection) {
                        window.getSelection().removeAllRanges();
                    }
                }
                // TODO: else, select just the first word in multi-word selection
                break;
            case 8: // backspace
                if (!showEditModal) this.deleteWords();
                break;
            case 39:
                if (!showEditModal) {
                    if (event.shiftKey) { // shift + left
                        this.selectWords('increase');
                    } else {
                        this.goToNextWord();
                    }
                }
                break;
            case 37:
                if (!showEditModal) {
                    if (event.shiftKey) { // shift + left
                        this.selectWords('decrease');
                    } else {
                        this.goToPreviousWord();
                    }
                }
                break;
            case 190: // period
                if (!showEditModal) {
                    this.insertPuncAfterSelectedWords('.')
                }
                break;
            case 188: // comma
                if (!showEditModal) {
                    this.insertPuncAfterSelectedWords(',')
                }
                break
            case 191: // question mark (or slash)
                if (!showEditModal) {
                    this.insertPuncAfterSelectedWords('?')
                }
                break
            case 49: // exclamation point
                if (!showEditModal) {
                    if (event.shiftKey) {
                        this.insertPuncAfterSelectedWords('!')
                    }
                }
                break
            case 9: // tab
                event.preventDefault()
                if (!showEditModal) {
                    if (event.shiftKey) {
                        this.goToPreviousWord();
                    } else {
                        this.goToNextWord()
                    }
                }
                break
            case 222:
                if (!showEditModal) {
                    if (event.metaKey && event.ctrlKey) { // ctrl + meta + '
                        this.goToPreviousPhrase();
                    } else if (!event.altKey) {
                        this.surroundSelectionWithStuff('"');
                    }
                }
                break
            case 186:
                if (!showEditModal) {
                    if (event.metaKey && event.ctrlKey) { // ctrl + meta + ;
                        this.goToNextPhrase();
                    } else { // colon
                        if (event.shiftKey) this.insertPuncAfterSelectedWords(':')
                    }
                }
                break
            case 90:
                if (!showEditModal) {
                    if (event.metaKey && event.shiftKey) { // meta + shift + z
                        event.preventDefault()
                        this.redo()
                    } else if (event.metaKey) { // meta + z
                        event.preventDefault()
                        this.undo()
                    }
                } else {
                    this.setState({ showEditModal: false })
                    removeSelection();
                }
                break
            default:
                return
        }
    }

}

export default InteractiveTranscript;