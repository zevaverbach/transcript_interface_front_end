import React, { Component } from 'react';
import Transcript from './transcript';
import EditModal from './editModal';
import MediaContainer from './mediaContainer'
import path from 'path'
import { CONFIDENCE_THRESHOLD, transcriptEndpoint } from './config'
import { removeSelection, animateClick, _downloadTxtFile } from './helpers/helpers'
import { changeQueueStep, insertQueueStep, deleteQueueStep } from './helpers/edit'
import {
    surrounds, endsSentence, removePunc, isCapitalized,
    toTitleCase, hasPuncAfter, hasPuncBefore, alwaysCapitalized
} from './helpers/punc'


class InteractiveTranscript extends Component {

    constructor(props) {
        super(props)
        this.state = {
            selectedWordIndices: {
                start: 0,
                offset: 0
            },
            transcript: null,
            undoQueue: [],
            redoQueue: [],
            showEditModal: false,
            editingWords: [],
            editModalEdited: false,
            wasPlaying: false,
        }
        this.mediaContainer = React.createRef()
    }

    componentDidMount() {
        let theTranscript;
        this.addListeners()

        const transcript = localStorage.getItem('transcript')
        if (transcript) {
            const parsedTranscript = JSON.parse(transcript)
            if (parsedTranscript) {
                theTranscript = parsedTranscript
            }
        }

        if (!theTranscript) {
            this.fetchTranscript()
        } else {
            this.setState({ transcript: theTranscript })
            const queueState = localStorage.getItem('queueState')
            if (queueState) {
                const parsedQueueState = JSON.parse(queueState)
                this.setState({
                    undoQueue: parsedQueueState.undoQueue,
                    redoQueue: parsedQueueState.redoQueue
                })
            }
        }

    }


    fetchTranscript = () => {
			['username', 'password', 'transcript_id'].forEach(itemName => {
				if (localStorage.getItem(itemName) === null) {
					itemValue = this.get(itemName);
					window[itemName] = itemValue;
				}
			});

			let headers = new Headers();
			headers.set(
				'Authorization', 
				'Basic ' + window.btoa(username + ":" + password).toString('base64'));

			fetch(transcriptEndpoint + transcript_id, 
						{method: 'GET', headers: headers})
        .then(response => response.json())
        .then(data => {
					this.setState({ transcript: data })
						localStorage.setItem(
							'transcript',
							JSON.stringify(data)
						)
				})
    }

		get = which => {
			localStorage.setItem(which, prompt(which + '?'))	
		}

    addListeners = () => [
        this.addKeyboardListener,
        this.addClickListener,
        this.addCloseListener,
        this.addLoadListener,
    ].forEach(func => func())

    addKeyboardListener = () => document.addEventListener('keydown', this.handleKeyDown)
    addClickListener = (element = document.body) => element.addEventListener('click', this.handleClick)
    addCloseListener = () => window.addEventListener('beforeunload', () => localStorage.setItem('currentWordIndex', this.state.selectedWordIndices.start))

    addLoadListener = () => window.addEventListener('load', () => {
        let selectedWordIndex = localStorage.getItem('currentWordIndex') || 0
        if (selectedWordIndex) {
            selectedWordIndex = parseInt(selectedWordIndex)

            this.setState({
                selectedWordIndices: {
                    start: parseInt(selectedWordIndex),
                    offset: 0
                }
            })
        }
        const player = this.getRef('player')
        player.currentTime = this.wordAt(selectedWordIndex).start + Math.random() * .01
    })

    handleClick = e => {
        const { showEditModal } = this.state
        if (showEditModal && e.target.tagName !== 'INPUT') {
            this.setState({ showEditModal: false })
        }
    }

    wordAt = index => this.state.transcript[index]

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

        let change, lastWord
        const firstWord = this.selectedWords()[0]
        const selectedWordsObject = this.getSelectedWordsObject()
        const oneWord = selectedWordsObject.offset === 0

        if (oneWord) {
            lastWord = firstWord
        } else {
            lastWord = this.selectedWords().slice(-1)[0]
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

            const { selectedWordIndices, transcript } = this.state
            const firstBetweenIndex = selectedWordIndices.start + 1
            const betweenWords = transcript.slice(firstBetweenIndex - 1, firstBetweenIndex + selectedWordIndices.offset)
            betweenWords.forEach(word => {
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

        this.undoRedoEdit('edit', { selectedWords: selectedWordsObject, change })
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
        let queue, steps, selectedWordIndices

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
                [transcript, selectedWordIndices] = deleteQueueStep(transcript, steps.insert)
            } else {
                [transcript, selectedWordIndices] = insertQueueStep(transcript, steps.insert)
            }
        }

        if (steps.delete) {
            if (whichOne === 'undo') {
                [transcript, selectedWordIndices] = insertQueueStep(transcript, steps.delete)
            } else {
                [transcript, selectedWordIndices] = deleteQueueStep(transcript, steps.delete)
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

        if (steps.selectedWords) {
            if (whichOne === 'undo' && steps.insert && steps.insert.length > 1) {
                selectedWordIndices = {
                    ...steps.selectedWords,
                    start: steps.selectedWords.start - 1
                }
            } else {
                selectedWordIndices = steps.selectedWords
            }
        }

        this.setState({
            transcript,
            ...queueState,
            selectedWordIndices
        })

        localStorage.setItem('transcript', JSON.stringify(transcript))
        localStorage.setItem('queueState', JSON.stringify(queueState))

    }

    getSelectedWordsObject = (minus = 0) => {
        const firstWordIndex = this.getSelectedWordIndex('first') - minus
        const lastWordIndex = this.getSelectedWordIndex('last')

        return {
            start: firstWordIndex,
            offset: lastWordIndex - firstWordIndex
        }
    }

    insertPunc = (punc, beforeAfter = 'after') => {

        let index

        if (beforeAfter === 'after') {
            index = this.getSelectedWordIndex('last')
        } else {
            index = this.getSelectedWordIndex('first') - 1
        }

        const word = this.wordAt(index)
        const { puncAfter } = word
        let change, same = false, newPunc
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

        if (endsSentence(punc) && !same) {
            const nextWord = this.wordAt(index + 1)
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
            const nextWord = this.wordAt(index + 1)
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

    goToNextWord = (skipHighConfidenceWords = false) => {
        const { transcript, selectedWordIndices } = this.state
        const player = this.getRef('player')

        let transcriptLength = transcript.length;

        let lastWordIndex = selectedWordIndices.offset > 1 ? selectedWordIndices.start + selectedWordIndices.offset : selectedWordIndices.start

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

            if (!player.paused && selectedWordIndex > selectedWordIndices.start + 2) {
                selectedWordIndex -= 2
                selectedWord = this.wordAt(selectedWordIndex)
            }

            this.setState({
                selectedWordIndices: {
                    start: selectedWordIndex,
                    offset: 0,
                },
            })
            player.currentTime = selectedWord.start + Math.random() * .01
        }
    }

    goToPreviousWord = (skipHighConfidenceWords = false) => {
        const { selectedWordIndices } = this.state
        const player = this.getRef('player')
        let firstWordIndex;
        if (selectedWordIndices.offset < 0) {
            firstWordIndex = selectedWordIndices.start + selectedWordIndices.offset
        } else {
            firstWordIndex = selectedWordIndices.start
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

        if (!player.paused && selectedWordIndex > selectedWordIndices.start + 2) {
            selectedWordIndex -= 2
            selectedWord = this.wordAt(selectedWordIndex)
        }

        if (!player.paused && selectedWordIndex === selectedWordIndices.start) {
            this.setState({
                selectedWordIndices: {
                    start: selectedWordIndices.start - 2,
                    offset: 0,
                }
            })
            return this.goToPreviousWord()
        }

        this.setState({
            selectedWordIndices: {
                start: selectedWordIndex,
                offset: 0,
            },
        })
        player.currentTime = selectedWord.start
    }

    getNewWordIndex = newPosition => {
        const { transcript, selectedWordIndices } = this.state
        const { start } = selectedWordIndices
        const transcript_length = transcript.length

        let minimumIndex = 0;
        let maxIndex = transcript_length - 1;
        let currentIndex;

        if (newPosition < transcript[0].start) {
            return 0
        } else if (newPosition > transcript.slice(-1)[0].end) {
            return transcript_length - 1
        }

        const search = firstGuess => {
            currentIndex = firstGuess || Math.floor((minimumIndex + maxIndex) / 2);

            const wordObject = transcript[currentIndex]

            if (newPosition >= wordObject.start && newPosition <= wordObject.end) {
                return currentIndex;
            }

            if (currentIndex < transcript_length - 1
                && newPosition > wordObject.end
                && newPosition < transcript[currentIndex + 1].start) {
                return currentIndex;
            }

            // optimize for the current word being one of the next few
            if (firstGuess && [start, start + 1, start + 2].includes(firstGuess)) {
                firstGuess++
            } else {
                firstGuess = null;
            }

            if (wordObject.start < newPosition) {
                minimumIndex = currentIndex + 1;
            } else if (wordObject.end > newPosition) {
                maxIndex = currentIndex - 1;
            }

            return search();
        };

        return search(start)
    }

    onTimeUpdate = newPosition => {
        if (this.state.selectedWordIndices.offset !== 0) return
        const newWordIndex = this.getNewWordIndex(newPosition)
        if (newWordIndex !== undefined) {
            this.setState({
                selectedWordIndices: {
                    start: newWordIndex,
                    offset: 0,
                },
            })
        }
    }

    onClickWord = word => {
        const player = this.getRef('player')
        this.setState({
            selectedWordIndices: {
                start: word.index,
                offset: 0,
            },
        })
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
        if (this.state.undoQueue.length === 0 && this.state.redoQueue.length === 0) return
        animateClick(this.getRef('undoAll'))
        if (window.confirm('Remove all changes to transcript?  This is not reversible.')) {
            localStorage.removeItem('queueState')
            localStorage.removeItem('transcript')
            localStorage.removeItem('currentWordIndex')
            this.setState({
                undoQueue: [],
                redoQueue: [],
                transcript: null,
                selectedWordIndices: {
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

    renderTranscript = () => {
        return (
            <span id='transcript'>
                <Transcript
                    transcript={this.state.transcript}
                    selectedWordIndices={this.state.selectedWordIndices}
                    onClickWord={this.onClickWord}
                />
            </span>
        )
    }

    renderEditModal() {
        const { editingWords } = this.state
        const words = this.selectedWords().map(word => word.word).join(' ')

        return (
            <EditModal
                onChange={this.onInputModalChange}
                onKeyUp={this.onInputModalKeyUp}
                onFocus={() => { document.execCommand('selectall') }}
                value={this.state.editModalEdited ? editingWords : words}
            />
        )

    }

    render() {
        const { transcript, showEditModal, undoQueue, redoQueue } = this.state
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
                {transcript && this.renderTranscript()}
            </React.Fragment >
        )
    }
}

export default InteractiveTranscript;
