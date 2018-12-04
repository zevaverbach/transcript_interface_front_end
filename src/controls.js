import React, { Component } from 'react';
import Redo from './redo'
import Undo from './undo'
import UndoAll from './undoAll'
import DownloadTranscript from './downloadTranscript'
import { test } from './config'


export default class Controls extends Component {

    constructor(props) {
        super(props)
        this.undo = React.createRef()
        this.undoAll = React.createRef()
        this.redo = React.createRef()
        this.downloadButton = React.createRef()
    }

    render() {
        const { queueLengths, onDownloadTranscriptClick, undo, redo, onUndoAllClick } = this.props
        const [undoLength, redoLength] = queueLengths
        return (
            <span id='controls'>
                <DownloadTranscript ref={this.downloadButton} onClick={onDownloadTranscriptClick} />
                <UndoAll ref={this.undoAll} onClick={onUndoAllClick} greyed={!test && undoLength === 0 && redoLength === 0} />
                <Undo ref={this.undo} onClick={undo} greyed={undoLength === 0} />
                <Redo ref={this.redo} onClick={redo} greyed={redoLength === 0} />
            </span>
        )
    }
}