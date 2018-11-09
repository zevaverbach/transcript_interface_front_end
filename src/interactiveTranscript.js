import React, { Component } from 'react';
import MediaPlayer from './mediaPlayer';
import Transcript from './transcript';
import transcript from './transcript.json';
import EditModal from './editModal';
import {
    removeSelection, endsSentence, removePunc, CONFIDENCE_THRESHOLD,
    isCapitalized, toTitleCase, hasPuncAfter, hasPuncBefore, alwaysCapitalized
} from './helpers'





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
        showEditModal: false,
        editingWords: [],
        editModalEdited: false,
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyDown)
    }

    wordAtIndex = index => this.state.transcript[index]

    onInputModalChange = event => {
        this.setState({
            editModalEdited: true,
            editingWords: event.target.value,
        })
    }

    onInputModalKeyUp = event => {
        if (event.keyCode === 13) { // enter
            this.setState({
                editModalEdited: false,
                showEditModal: false,
                play: true,
                updatePlayer: false
            })
            removeSelection()

            let { editingWords } = this.state

            if (editingWords.length === 0) return

            const selectedWordsObject = this.getSelectedWordsObject()
            const selectedWords = this.selectedWords()

            const edit = {
                selectedWords: {
                    ...selectedWordsObject,
                    offset: 0
                }
            }

            editingWords = editingWords.split(' ')
            let newWordsSurplus = editingWords.length - selectedWordsObject.offset - 1
            let changeArray
            if (newWordsSurplus) {
                changeArray = editingWords.slice(0, -newWordsSurplus)
            } else {
                changeArray = editingWords
            }

            edit.change = [
                changeArray.map((word, index) => (
                    {
                        ...selectedWords[index],
                        confidence: 1,
                        alwaysCapitalized: alwaysCapitalized(word),
                        word: removePunc(word),
                        puncAfter: hasPuncAfter(word),
                        puncBefore: hasPuncBefore(word),
                        prevState: selectedWords[index]
                    })
                )
            ]

            if (newWordsSurplus < 0) {
                edit.delete = [selectedWords.slice(newWordsSurplus)]


            } else if (newWordsSurplus > 0) {
                const lastOverlappingWord = selectedWords.slice(-1)[0]
                const lastChangeIndex = edit.change[0].slice(-1)[0].index
                edit.insert = [
                    editingWords.slice(-newWordsSurplus).map((word, index) => (
                        {
                            ...lastOverlappingWord,
                            confidence: 1,
                            alwaysCapitalized: alwaysCapitalized(word),
                            word: removePunc(word),
                            puncAfter: hasPuncAfter(word),
                            puncBefore: hasPuncBefore(word),
                            index: lastChangeIndex + index + 1,
                        }))
                ]
            }

            this.undoRedoEdit('edit', edit)
        }
    }

    renderEditModal() {
        const { editingWords } = this.state
        const words = this.selectedWords().map(word => word.word).join(' ')

        return (
            <EditModal
                onChange={this.onInputModalChange}
                onKeyUp={this.onInputModalKeyUp}
                onFocus={(event) => { document.execCommand('selectall') }}
                value={this.state.editModalEdited ? editingWords : words}
            />
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

        let change

        if (this.getSelectedWordsObject.offset === 0) {
            change = [
                [
                    {
                        ...this.selectedWords()[0],
                        puncBefore: '"',
                        puncAfter: '"',
                        prevState: {
                            puncBefore: false,
                            puncAfter: false,
                        }
                    }
                ]
            ]
        } else {
            change = [
                [
                    {
                        ...this.selectedWords()[0],
                        puncBefore: '"',
                        prevState: {
                            puncBefore: false,
                        }
                    }
                ],
                [
                    {
                        ...this.selectedWords().slice(-1)[0],
                        puncAfter: '"',
                        prevState: {
                            puncAfter: false,
                        }
                    }
                ]
            ]
        }

        this.undoRedoEdit('edit',
            {
                selectedWords: this.getSelectedWordsObject(), change,
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

    toggleCase = () => {
        const edit = {
            selectedWords: this.getSelectedWordsObject(),
            change: [
                this.selectedWords().map(word => (
                    {
                        ...word,
                        word: isCapitalized(word.word) ? word.word.toLowerCase() : toTitleCase(word.word),
                        prevState: {
                            word: word.word
                        }
                    }
                ))
            ]
        }
        this.undoRedoEdit('edit', edit)
    }

    changeQueueStep = (whichOne, transcript, step) => {
        step.forEach(changeChunk => {
            const wordMap = {}
            changeChunk.forEach(word => wordMap[word.index] = word)

            transcript = transcript
                .map((word, index) => {
                    let changedWord = wordMap[index]
                    if (changedWord) {
                        if (whichOne === 'undo') {
                            changedWord = {
                                ...changedWord,
                                ...changedWord.prevState
                            }
                            delete changedWord.prevState
                        }
                        return changedWord
                    }
                    return word
                })

        })

        return transcript
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

        if (step.change) {
            transcript = this.changeQueueStep(whichOne, transcript, step.change)
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

    getSelectedWordsObject = () => {
        const firstWordIndex = this.getSelectedWordIndex('first')
        const lastWordIndex = this.getSelectedWordIndex('last')

        return {
            start: firstWordIndex,
            offset: lastWordIndex - firstWordIndex
        }
    }

    insertPuncAfterSelectedWords = punc => {

        const index = this.getSelectedWordIndex('last')
        const word = this.wordAtIndex(index)
        if (word.puncAfter === punc) return

        let change


        change = [
            [
                {
                    ...word,
                    puncAfter: punc,
                    prevState: {
                        puncAfter: word.puncAfter
                    }
                }
            ]
        ]

        if (endsSentence(punc)) {
            const nextWord = this.wordAtIndex(index + 1)
            if (!isCapitalized(nextWord.word)) {
                change = change.concat([[
                    {
                        ...nextWord,
                        word: toTitleCase(nextWord.word),
                        prevState: {
                            word: nextWord.word
                        }
                    }
                ]])
            }
        } else {
            const nextWord = this.wordAtIndex(index + 1)
            if (isCapitalized(nextWord.word) && !alwaysCapitalized(nextWord.word)) {
                change = change.concat([[
                    {
                        ...nextWord,
                        word: nextWord.word.toLowerCase(),
                        prevState: {
                            word: nextWord.word
                        }
                    }
                ]])
            }

        }

        const edit = {
            selectedWords: this.getSelectedWordsObject(),
            change
        }

        this.undoRedoEdit('edit', edit)

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

    // goToNextPhrase = () => {
    //     const { transcript } = this.state
    //     const nextPunctuationIndex = this.findClosestPunctuation('next')
    //     if (nextPunctuationIndex !== null && nextPunctuationIndex < transcript.length - 1) {
    //         this.setState({
    //             selectedWordIndices: {
    //                 start: nextPunctuationIndex + 1,
    //                 offset: 0,
    //             },
    //             playPosition: this.wordAtIndex(nextPunctuationIndex + 1).wordStart,
    //             updatePlayer: true
    //         })
    //     }
    // }

    // goToPreviousPhrase = () => {
    //     let previousPunctuationIndex = this.findClosestPunctuation('previous')
    //     if (previousPunctuationIndex === 0) previousPunctuationIndex = -1
    //     if (previousPunctuationIndex) {
    //         const playPosition = this.wordAtIndex(previousPunctuationIndex + 1).wordStart
    //         this.setState({
    //             selectedWordIndices: {
    //                 start: previousPunctuationIndex + 1,
    //                 offset: 0,
    //             },
    //             playPosition: playPosition - (Math.random() * .1),
    //             updatePlayer: true
    //         })
    //     }
    // }

    goToNextWord = (skipHighConfidenceWords = false) => {
        const { transcript, selectedWordIndices } = this.state
        let transcriptLength = transcript.length;
        let lastWordIndex;
        if (selectedWordIndices.offset > 1) {
            lastWordIndex = selectedWordIndices.start + selectedWordIndices.offset
        } else {
            lastWordIndex = selectedWordIndices.start
        }

        if (lastWordIndex + 1 < transcriptLength) {
            let selectedWordIndex = lastWordIndex + 1
            let selectedWord = this.wordAtIndex(selectedWordIndex)
            while (selectedWordIndex < transcriptLength - 1 &&
                (selectedWord.wordStart === null
                    || (skipHighConfidenceWords && selectedWord.confidence > CONFIDENCE_THRESHOLD))) {
                selectedWordIndex++;
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
    }

    goToPreviousWord = (skipHighConfidenceWords = false) => {
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
        while (selectedWordIndex !== 0 &&
            (selectedWord.wordStart === null
                || (skipHighConfidenceWords && selectedWord.confidence > CONFIDENCE_THRESHOLD))) {
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

    onClickWord = word => {
        this.setState({
            playPosition: word.wordStart + Math.random() * .1,
            selectedWordIndices: {
                start: word.index,
                offset: 0,
            },
            updatePlayer: true,
        })
    }

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

    markSelectionConfident = () => {
        const edit = {
            selectedWords: this.getSelectedWordsObject(),
            change: [
                this.selectedWords().map(word => (
                    {
                        ...word,
                        confidence: 1,
                        prevState: {
                            confidence: word.confidence
                        }
                    }
                ))
            ]
        }
        this.undoRedoEdit('edit', edit)
    }

    handleKeyDown = event => {

        const { showEditModal } = this.state

        if (showEditModal) {
            switch (event.keyCode) {
                case 27: // escape
                    this.setState({ showEditModal: false })
                    if (window.getSelection) {
                        window.getSelection().removeAllRanges();
                    }
                    break;
                case 90: // ctrl-z
                    if (event.metaKey) { // meta + z
                        this.setState({ showEditModal: false })
                        removeSelection();
                    }
                    break;
                case 9: // tab
                    event.preventDefault()
                    break
                default:
                    return
            }
        } else {

            switch (event.keyCode) {
                case 13: // enter
                    this.setState({ showEditModal: true, play: false, updatePlayer: true })
                    break;
                case 32: // spacebar
                    event.preventDefault()
                    this.markSelectionConfident()
                    break;
                case 8: // backspace
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
                case 190: // period
                    this.insertPuncAfterSelectedWords('.')
                    break;
                case 188: // comma
                    this.insertPuncAfterSelectedWords(',')
                    break
                case 191: // question mark (or slash)
                    this.insertPuncAfterSelectedWords('?')
                    break
                case 192: // tilde
                    if (event.ctrlKey) {
                        event.preventDefault()
                        this.toggleCase()
                    }
                    break
                case 49: // exclamation point
                    if (event.shiftKey) {
                        this.insertPuncAfterSelectedWords('!')
                    }
                    break
                case 9: // tab
                    event.preventDefault()
                    if (event.shiftKey) {
                        this.goToPreviousWord(true);
                    } else {
                        this.goToNextWord(true);
                    }
                    break
                case 222:
                    if (event.metaKey && event.ctrlKey) { // ctrl + meta + '
                        this.goToPreviousPhrase();
                    } else if (!event.altKey) {
                        this.surroundSelectionWithStuff('"');
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
    }

}

export default InteractiveTranscript;