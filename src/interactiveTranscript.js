import React, { Component } from 'react';
import Transcript from './transcript';
import EditModal from './editModal';
import MediaContainer from './mediaContainer'
import path from 'path'
import { CONFIDENCE_THRESHOLD, transcriptEndpoint } from './config'
import { removeSelection, animateClick, _downloadTxtFile, makeTranscriptSecondsObject } from './helpers/helpers'
import { changeQueueStep, insertQueueStep, deleteQueueStep } from './helpers/edit'
import {
    surrounds, endsSentence, removePunc, isCapitalized,
    toTitleCase, hasPuncAfter, hasPuncBefore, alwaysCapitalized
} from './helpers/punc'


class InteractiveTranscript extends Component {

    constructor(props) {
        super(props)
        this.state = {
            selectedWordPositions: [],
            transcript: null,
            transcriptSeconds: null,
            transcriptKeys: null,
            currentPosition: null,
            firstWordPosition: null,
            lastWordPosition: null,
            undoQueue: [],
            redoQueue: [],
            showEditModal: false,
            editingWords: [],
            editModalEdited: false,
            wasPlaying: false,
        }
        this.mediaContainer = React.createRef()
    }

    wordAt = time => this.state.transcript[time]
    wordsAt = times => times.map(time => this.state.transcript[time])
    nextWord = word => this.wordAt(word.next)
    selectedWords = () => this.wordsAt(this.state.selectedWordPositions)
    firstWord = () => this.wordAt(this.state.firstWordPosition)

    componentDidMount() {
        this.addListeners()

        if (!localStorage.getItem('transcript')) {
            this.fetchTranscript()
        } else {
            const { undoQueue, redoQueue } = JSON.parse(localStorage.getItem('queueState'))
            const transcript = JSON.parse(localStorage.getItem('transcript'))
            const firstWordPosition = parseFloat(localStorage.getItem('firstWordPosition'))
            this.setState({
                transcript,
                undoQueue,
                redoQueue,
                firstWordPosition,
                lastWordPosition: parseFloat(localStorage.getItem('lastWordPosition')),
                selectedWordPositions: JSON.parse(localStorage.getItem('selectedWordPositions')) || [firstWordPosition],
                transcriptSeconds: makeTranscriptSecondsObject(transcript),
                transcriptKeys: Object.keys(transcript).map(time => parseFloat(time)).sort(),
            })
        }
    }

    fetchTranscript = () => {
        fetch(transcriptEndpoint)
            .then(response => response.json())
            .then(data => {
                let transcript = Object()
                Object.entries(data.transcript).forEach(([startTime, word]) => {
                    transcript[parseFloat(startTime)] = word
                })

                const transcriptSeconds = makeTranscriptSecondsObject(transcript)
                const firstWordPosition = parseFloat(data.firstWordPosition)
                const lastWordPosition = parseFloat(data.lastWordPosition)
                const transcriptKeys = Object.keys(transcript).map(time => parseFloat(time)).sort()

                this.setState({ transcript, firstWordPosition, lastWordPosition, transcriptSeconds, transcriptKeys })

                localStorage.setItem('transcript', JSON.stringify(transcript))
                localStorage.setItem('firstWordPosition', firstWordPosition)
                localStorage.setItem('lastWordPosition', lastWordPosition)
                localStorage.setItem('queueState', JSON.stringify({ undoQueue: [], redoQueue: [] }))
            })
    }

    addListeners = () => [
        this.addKeyboardListener,
        this.addClickListener,
        this.addCloseListener,
        this.addLoadListener,
    ].forEach(func => func())

    addKeyboardListener = () => document.addEventListener('keydown', this.handleKeyDown)
    addClickListener = (element = document.body) => element.addEventListener('click', this.handleClick)
    addCloseListener = () => window.addEventListener('beforeunload', () => localStorage.setItem('currentPosition', this.state.currentPosition))

    addLoadListener = () => window.addEventListener('load', () => {
        // const player = this.getRef('player')
        // player.currentTime = selectedWordPosition + Math.random() * .01
    })

    handleClick = e => {
        const { showEditModal } = this.state
        if (showEditModal && e.target.tagName !== 'INPUT') {
            this.setState({ showEditModal: false })
        }
    }

    getRef = refName => {
        switch (refName) {
            case 'player':
                return this.mediaContainer.current.mediaPlayer.current.player.current
            case 'downloadButton':
                return this.mediaContainer.current.controls.current.downloadButton.current.downloadButton.current.children[0]
            case 'redoButton':
                return this.mediaContainer.current.controls.current.redo.current.redoButton.current.children[0]
            case 'undoButton':
                return this.mediaContainer.current.controls.current.undo.current.undoButton.current.children[0]
            case 'undoAll':
                return this.mediaContainer.current.controls.current.undoAll.current.undoAll.current.children[0]
            default:
                return
        }
    }

    handleKeyDown = event => {

        const { showEditModal } = this.state
        switch (event.keyCode) {
            case 9: // tab
                event.preventDefault()
                if (event.shiftKey) {
                    this.goToPreviousWord(true);
                } else {
                    this.goToNextWord(true);
                }
                break;
            case 39:
                if (event.shiftKey) { // shift + right
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
            default:
                if (!showEditModal) {
                    switch (event.keyCode) {
                        case 13: // enter
                            event.preventDefault()
                            const player = this.getRef('player')
                            this.setState({ showEditModal: true, wasPlaying: !player.paused })
                            player.pause()
                            break;
                        case 32: // spacebar
                            event.preventDefault()
                            if (!event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
                                this.toggleSelectionConfident()
                                this.goToNextWord(true)
                            } else if (event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
                                this.setAllWordsConfident()
                            }
                            break;
                        case 8: // backspace
                            this.deleteWords();
                            break;
                        case 190: // period
                            if (!event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
                                this.insertPunc('.')
                            }
                            if (event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
                                this.insertPunc('.', 'before')
                            }
                            break;
                        case 188: // comma
                            if (!event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
                                this.insertPunc(',')
                            }
                            if (event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
                                this.insertPunc(',', 'before')
                            }
                            break
                        case 191: // question mark (or slash)
                            if (event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
                                this.insertPunc('?')
                            }
                            if (!event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
                                this.insertPunc('/')
                            }
                            break
                        case 192: // tilde
                            if (event.ctrlKey) {
                                event.preventDefault()
                                this.toggleCase()
                            }
                            break
                        case 49: // exclamation point
                            if (event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
                                this.insertPunc('!')
                            }
                            break
                        case 222:
                            if (event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
                                this.surroundSelectionWithStuff(['"', '"']);
                            } else if (!event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
                                this.surroundSelectionWithStuff(["'", "'"]);
                            }
                            break
                        case 219:
                            if (!event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) { // [
                                this.surroundSelectionWithStuff(["[", "]"]);
                            }
                            break
                        case 221:
                            if (!event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) { // [
                                this.surroundSelectionWithStuff(["[", "]"]);
                            }
                            break
                        case 57:
                            if (event.shiftKey) { // (
                                this.surroundSelectionWithStuff(["(", ")"]);
                            }
                            break
                        case 48:
                            if (event.shiftKey) { // )
                                this.surroundSelectionWithStuff(["(", ")"]);
                            }
                            break
                        case 186:
                            if (event.shiftKey) this.insertPunc(':')
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
                    return

                } else if (showEditModal) {
                    switch (event.keyCode) {
                        case 27: // escape
                            this.setState(
                                {
                                    showEditModal: false,
                                    editingWords: this.selectedWords().map(word => word.word).join(' ')
                                }
                            )
                            if (window.getSelection) {
                                window.getSelection().removeAllRanges();
                            }
                            break;
                        case 90:
                            if (event.metaKey || event.ctrlKey) { // meta/ctrl + z 
                                this.setState({ showEditModal: false })
                                removeSelection();
                            }
                            break;
                        default:
                            return
                    }
                }
        }
    }

    onInputModalChange = event => {
        this.setState({
            editModalEdited: true,
            editingWords: event.target.value,
        })
    }

    onInputModalKeyUp = event => {
        const player = this.getRef('player')
        let { wasPlaying, editingWords } = this.state
        let changeArray
        event.preventDefault()

        if (event.keyCode === 13) { // enter
            this.setState({
                editModalEdited: false,
                showEditModal: false,
            })
            if (wasPlaying) {
                player.play()
                this.setState({ wasPlaying: false })
            }

            removeSelection()

            if (editingWords.length === 0) return

            const selectedWords = this.selectedWords()

            const edit = { selectedWords }

            editingWords = editingWords.split(' ')
            let newWordsSurplus = editingWords.length - selectedWords.length

            if (newWordsSurplus) {
                changeArray = newWordsSurplus <= 0 ? [editingWords[0]] : editingWords.slice(0, -newWordsSurplus)
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
                edit.insert = [
                    editingWords.slice(-newWordsSurplus).map(word => (
                        {
                            ...lastOverlappingWord,
                            confidence: 1,
                            alwaysCapitalized: alwaysCapitalized(word),
                            word: removePunc(word),
                            puncAfter: hasPuncAfter(word),
                            puncBefore: hasPuncBefore(word),
                        }))
                ]
            }

            this.undoRedoEdit('edit', edit)
            this.goToNextWord(true)
            this.setState({ editingWords: [] })
        }
    }

    redo = () => {
        if (this.state.redoQueue.length > 0) {
            animateClick(this.getRef('redoButton'))
            this.undoRedoEdit('redo')
        }
    }
    undo = () => {
        if (this.state.undoQueue.length > 0) {
            animateClick(this.getRef('undoButton'))
            this.undoRedoEdit('undo')
        }
    }

    consecutive = wordPositions => {
        let prevWord = wordPositions[0]
        wordPositions.slice(1).forEach(word => {
            if (prevWord.next !== word.start) {
                return false
            }
        })
        return true
    }

    surroundSelectionWithStuff = (stuff, selection = null) => {

        const selectedWordPositions = selection || this.state.selectedWordPositions

        if (!this.consecutive(selectedWordPositions)) {
            const selectedWords = this.selectedWords()
            let prevWord = selectedWords[0]
            let chunk = [prevWord.start]

            selectedWords.slice(1).forEach(word => {
                if (prevWord.next === word.start) {
                    chunk.push(word.start)
                } else {
                    this.surroundSelectionWithStuff(stuff, chunk)
                    chunk = []
                }
                prevWord = word
            })

        } else {

            let change, lastWord
            const firstWord = this.wordAt(selectedWordPositions[0])
            const oneWord = selectedWordPositions.length === 1

            if (oneWord) {
                lastWord = firstWord
            } else {
                lastWord = this.wordAt(selectedWordPositions.slice(-1)[0])
            }

            let puncBefore, puncAfter

            if (firstWord.puncBefore && lastWord.puncAfter) {

                if (firstWord.puncBefore.includes(stuff[0]) && lastWord.puncAfter.includes(stuff[1])) {
                    puncBefore = firstWord.puncBefore.filter(punc => punc !== stuff[0])
                    puncAfter = lastWord.puncAfter.filter(punc => punc !== stuff[1])
                } else {
                    puncBefore = [stuff[0]].concat(firstWord.puncBefore)
                    puncAfter = lastWord.puncAfter.concat(stuff[1])
                }
            } else {
                puncBefore = [stuff[0]]
                puncAfter = [stuff[1]]
            }

            if (oneWord) {
                change = [
                    [
                        {
                            ...firstWord,
                            puncBefore,
                            puncAfter,
                            prevState: {
                                puncBefore: firstWord.puncBefore,
                                puncAfter: lastWord.puncAfter
                            }
                        }
                    ]
                ]
            } else {

                change = [
                    [
                        {
                            ...firstWord,
                            puncBefore,
                            prevState: {
                                puncBefore: firstWord.puncBefore,
                            }
                        },
                        {
                            ...lastWord,
                            puncAfter,
                            prevState: {
                                puncAfter: lastWord.puncAfter,
                            }
                        },
                    ]
                ]

                let word = firstWord

                Array(selectedWordPositions.length - 2).fill(null) // repeat 
                    .forEach(_ => {
                        word = this.wordAt(word.next)
                        if (word.puncBefore && word.puncBefore.includes(stuff[0])) {
                            change[0].push(
                                {
                                    ...word,
                                    puncBefore: puncBefore.filter(punc => punc === stuff)
                                }
                            )
                        }
                        if (word.puncAfter && word.puncAfter.includes(stuff[1])) {
                            change[0].push(
                                {
                                    ...word,
                                    puncAfter: puncAfter.filter(punc => punc === stuff)
                                }
                            )
                        }
                    })
            }
            this.undoRedoEdit('edit', { selectedWordPositions, change })
        }
    }

    deleteWords = () => {

        this.undoRedoEdit('edit',
            {
                selectedWords: {
                    ...this.getSelectedWordsObject(1),
                    offset: 0
                },
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

    undoRedoEdit = (whichOne, edit = false) => {

        if (!['edit', 'undo', 'redo'].includes(whichOne)) throw Error('invalid argument for `whichOne`.')

        let { redoQueue, undoQueue, transcript } = this.state
        let queue, steps, selectedWordPositions

        queue = whichOne === 'undo' ? undoQueue : redoQueue

        if (edit) {
            queue = null
            steps = edit
        }

        if (queue) {
            if (queue.length === 0) return
            steps = queue.slice(-1)[0]
        }

        if (steps.change) {
            transcript = changeQueueStep(whichOne, transcript, steps.change)
        }

        if (steps.insert) {
            if (whichOne === 'undo') {
                [transcript, selectedWordPositions] = deleteQueueStep(transcript, steps.insert)
            } else {
                [transcript, selectedWordPositions] = insertQueueStep(transcript, steps.insert)
            }
        }

        if (steps.delete) {
            if (whichOne === 'undo') {
                [transcript, selectedWordPositions] = insertQueueStep(transcript, steps.delete)
            } else {
                [transcript, selectedWordPositions] = deleteQueueStep(transcript, steps.delete)
            }
        }

        let queueState = {}
        if (whichOne === 'undo') {
            queueState = {
                undoQueue: queue.slice(0, -1),
                redoQueue: redoQueue.concat(steps),
            }
        } else if (whichOne === 'redo') {
            queueState = {
                redoQueue: queue.slice(0, -1),
                undoQueue: undoQueue.concat(steps),
            }
        } else {
            // edit
            queueState = {
                undoQueue: undoQueue.concat(steps),
                redoQueue: [],
            }
        }

        if (steps.selectedWordPositions) {
            if (whichOne === 'undo' && steps.insert && steps.insert.length > 1) {
                selectedWordPositions = {
                    ...steps.selectedWords,
                    start: steps.selectedWords.start - 1
                }
            } else {
                selectedWordPositions = steps.selectedWordPositions
            }
        }

        this.setState({
            transcript,
            ...queueState,
            selectedWordPositions
        })

        localStorage.setItem('transcript', JSON.stringify(transcript))
        localStorage.setItem('queueState', JSON.stringify(queueState))
        localStorage.setItem('selectedWordPositions', JSON.stringify(selectedWordPositions))

    }

    insertPunc = (punc, beforeAfter = 'after') => {

        let wordPosition
        const selectedWordPositions = this.state.selectedWordPositions

        if (beforeAfter === 'after') {
            wordPosition = selectedWordPositions.slice(-1)[0]
        } else {
            wordPosition = selectedWordPositions[0]
        }

        const word = this.wordAt(wordPosition)
        const { puncAfter } = word
        let change, newPunc, same = false
        if (puncAfter && puncAfter.includes(punc)) {
            same = true
        }

        if (same) {
            newPunc = puncAfter.filter(p => p !== punc)
        } else if (puncAfter && surrounds.some(p => puncAfter.includes(p))) {
            newPunc = [punc, '"']
        } else {
            newPunc = [punc]
        }

        change = [[{
            ...word,
            puncAfter: newPunc,
            prevState: { puncAfter }
        }]]

        const nextWord = this.nextWord(word)
        if (endsSentence(punc) && !same) {
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

        const edit = { selectedWordPositions, change }

        this.undoRedoEdit('edit', edit)

    }

    selectWords = whichOne => {
        const { selectedWordPositions, transcript } = this.state
        const firstOrLastWordIndex = selectedWordPositions.start + selectedWordPositions.offset

        if ((whichOne === 'increase' && firstOrLastWordIndex === transcript.length)
            || (whichOne === 'decrease' && firstOrLastWordIndex === 0)) return

        const offset = whichOne === 'increase' ? 1 : -1

        this.setState({
            selectedWordPositions: {
                ...selectedWordPositions,
                offset: selectedWordPositions.offset + offset
            }
        })

    }

    goToNextWord = (skipHighConfidenceWords = false) => {
        const { transcript, selectedWordPositions } = this.state
        const player = this.getRef('player')

        let transcriptLength = transcript.length;

        let lastWordIndex = selectedWordPositions.offset > 1 ? selectedWordPositions.start + selectedWordPositions.offset : selectedWordPositions.start

        let selectedWordIndex, selectedWord

        if (lastWordIndex + 1 < transcriptLength) {
            selectedWordIndex = lastWordIndex + 1
            selectedWord = this.wordAt(selectedWordIndex)

            while (selectedWordIndex < transcriptLength - 1 && (
                selectedWord.start === null
                || (skipHighConfidenceWords && selectedWord.confidence > CONFIDENCE_THRESHOLD)
            )) {
                selectedWordIndex++;
                selectedWord = this.wordAt(selectedWordIndex)
            }

            if (!player.paused && selectedWordIndex > selectedWordPositions.start + 2) {
                selectedWordIndex -= 2
                selectedWord = this.wordAt(selectedWordIndex)
            }

            this.setState({
                selectedWordPositions: {
                    start: selectedWordIndex,
                    offset: 0,
                },
            })
            player.currentTime = selectedWord.start + Math.random() * .01
        }
    }

    goToPreviousWord = (skipHighConfidenceWords = false) => {
        const { selectedWordPositions } = this.state
        const player = this.getRef('player')
        let firstWordIndex;
        if (selectedWordPositions.offset < 0) {
            firstWordIndex = selectedWordPositions.start + selectedWordPositions.offset
        } else {
            firstWordIndex = selectedWordPositions.start
        }

        if (firstWordIndex === 0) return;

        let selectedWordIndex = firstWordIndex - 1
        let selectedWord = this.wordAt(selectedWordIndex)
        while (selectedWordIndex !== 0 &&
            (selectedWord.start === null
                || (skipHighConfidenceWords && selectedWord.confidence > CONFIDENCE_THRESHOLD))) {
            selectedWordIndex--;
            selectedWord = this.wordAt(selectedWordIndex)
        }

        if (!player.paused && selectedWordIndex > selectedWordPositions.start + 2) {
            selectedWordIndex -= 2
            selectedWord = this.wordAt(selectedWordIndex)
        }

        if (!player.paused && selectedWordIndex === selectedWordPositions.start) {
            this.setState({
                selectedWordPositions: {
                    start: selectedWordPositions.start - 2,
                    offset: 0,
                }
            })
            return this.goToPreviousWord()
        }

        this.setState({
            selectedWordPositions: {
                start: selectedWordIndex,
                offset: 0,
            },
        })
        player.currentTime = selectedWord.start
    }

    positionClosestTo = position => {
        const wordsAtSecond = this.state.transcriptSeconds[parseInt(position)]
        if (wordsAtSecond.length === 0) return null
        let closestWord = wordsAtSecond[0]
        let diff = closestWord.start - position
        let smallestDiff

        for (const word of Object.values(wordsAtSecond).slice(1)) {
            if (diff < 0 && diff > smallestDiff) {
                smallestDiff = diff
                closestWord = word
            }
            diff = word.start - position
        }
        return closestWord.start

    }

    getNewWordIndex = newPosition => {
        const { transcriptSeconds, firstWordPosition, lastWordPosition } = this.state

        if (newPosition <= firstWordPosition) return firstWordPosition
        if (newPosition >= lastWordPosition) return lastWordPosition

        if (Object.keys(transcriptSeconds).includes(parseInt(newPosition).toString())) {
            const guess = this.positionClosestTo(newPosition)
            return guess
        }
    }


    firstWord = () => this.state.transcript[this.state.firstWordPosition]

    onTimeUpdate = newPosition => {
        if (this.state.selectedWordPositions.offset !== 0) return
        const newWordIndex = this.getNewWordIndex(newPosition)
        if (newWordIndex) {
            this.setState({
                selectedWordPositions: {
                    start: newWordIndex,
                    offset: 0,
                },
            })
        }
    }

    onClickWord = word => {
        this.setState({
            selectedWordPositions: [word.start]
        })
        const player = this.getRef('player')
        player.currentTime = word.start + Math.random() * .01
    }

    setAllWordsConfident = () => {
        this.setState({ transcript: this.state.transcript.map(word => word.confidence < CONFIDENCE_THRESHOLD ? { ...word, confidence: 1 } : word) })
    }

    toggleSelectionConfident = () => {
        const edit = {
            selectedWords: this.getSelectedWordsObject(),
            change: [
                this.selectedWords().map(word => (
                    {
                        ...word,
                        confidence: word.confidence < CONFIDENCE_THRESHOLD ? 1 : 0,
                        prevState: {
                            confidence: word.confidence
                        }
                    }
                ))
            ]
        }
        this.undoRedoEdit('edit', edit)
    }

    onDownloadTranscriptClick = () => {
        animateClick(this.getRef('downloadButton'))
        const { mediaSource } = this.props
        _downloadTxtFile(this.state.transcript, path.basename(mediaSource, path.extname(mediaSource)) + '.txt')
    }

    onUndoAllClick = () => {
        // if (this.state.undoQueue.length === 0 && this.state.redoQueue.length === 0) return
        animateClick(this.getRef('undoAll'))
        if (window.confirm('Remove all changes to transcript?  This is not reversible.')) {
            localStorage.removeItem('queueState')
            localStorage.removeItem('transcript')
            localStorage.removeItem('currentPosition')
            this.setState({
                undoQueue: [],
                redoQueue: [],
                transcript: null,
                selectedWordPositions: {
                    start: 0,
                    offset: 0
                }
            })
            this.fetchTranscript()
        }
    }

    togglePlay = () => {
        const player = this.getRef('player')
        if (player.paused) {
            player.play()
        } else {
            player.pause()
        }
    }

    stopPlayback = () => {
        const player = this.getRef('player')
        player.pause()
    }

    renderEditModal() {
        const { editingWords } = this.state
        const words = this.selectedWords().map(word => word.word).join(' ')

        return (
            <EditModal
                onChange={this.onInputModalChange}
                onKeyUp={this.onInputModalKeyUp}
                onFocus={() => { document.execCommand('selectall') }
                }
                value={this.state.editModalEdited ? editingWords : words}
            />
        )

    }

    render() {
        const { selectedWordPositions, transcript, showEditModal, undoQueue, redoQueue } = this.state
        const queueLengths = [undoQueue.length, redoQueue.length]

        return (
            <React.Fragment>
                <MediaContainer
                    queueLengths={queueLengths}
                    undo={this.undo}
                    redo={this.redo}
                    onTimeUpdate={this.onTimeUpdate}
                    mediaSource={this.props.mediaSource}
                    onClickPlayPause={this.onClickPlayPause}
                    onUndoAllClick={this.onUndoAllClick}
                    onDownloadTranscriptClick={this.onDownloadTranscriptClick}
                    ready={transcript !== null}
                    togglePlay={this.togglePlay}
                    stopPlayback={this.stopPlayback}
                    ref={this.mediaContainer}
                />
                {showEditModal && this.renderEditModal()}
                {transcript && (
                    <span id='transcript'>
                        <Transcript
                            firstWord={this.firstWord()}
                            getNextWord={this.nextWord}
                            selectedWordPositions={selectedWordPositions}
                            onClickWord={this.onClickWord}
                        />
                    </span>
                )
                }
            </React.Fragment >
        )
    }
}

export default InteractiveTranscript;