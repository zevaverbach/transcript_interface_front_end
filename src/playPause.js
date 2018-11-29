import React, { Component } from 'react'
import { MdPlayArrow, MdPause } from 'react-icons/md'

export class PlayPause extends Component {

    constructor(props) {
        super(props)
        this.playPause = React.createRef()
    }

    render() {
        const { playing, togglePlay } = this.props
        return (
            <span
                id="play-pause"
                ref={this.playPause}
                title={playing ? "pause ('`') " : "play (';') "}
                style={{ cursor: 'pointer' }}
                onClick={togglePlay}
            >
                {playing ? <MdPause /> : <MdPlayArrow />}
            </span>
        )
    }
}