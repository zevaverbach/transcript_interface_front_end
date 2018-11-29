import React, { Component } from 'react';
import Redo from './redo'
import Undo from './undo'
import { PlayPause } from './playPause'
import DownloadTranscript from './downloadTranscript'


export default class Controls extends Component {

    constructor(props) {
        super(props)
        this.undo = React.createRef()
        this.redo = React.createRef()
        this.downloadButton = React.createRef()
        this.playPause = React.createRef()
    }

    render() {
        const { queueLengths, onDownloadTranscriptClick, undo, redo, togglePlay, playing } = this.props
        const [undoLength, redoLength] = queueLengths
        return (
            <span id='controls'>
                <DownloadTranscript ref={this.downloadButton} onClick={onDownloadTranscriptClick} />
                <Undo ref={this.undo} onClick={undo} greyed={undoLength === 0} />
                <Redo ref={this.redo} onClick={redo} greyed={redoLength === 0} />
                <PlayPause ref={this.playPause} playing={playing} togglePlay={togglePlay} />
            </span>
        )
    }
}