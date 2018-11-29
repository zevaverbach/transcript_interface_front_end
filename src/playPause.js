import React, { Component } from 'react'
import { MdPlayArrow, MdPause } from 'react-icons/md'

export class PlayPause extends Component {

    constructor(props) {
        super(props)
        this.playPause = React.createRef()
    }

    render() {
        const { playing, onClick } = this.props
        return (
            <span
                id="play-pause"
                ref={this.playPause}
                title={playing ? "pause (`) " : "play (;) "}
                style={{ cursor: 'pointer' }}
                onClick={onClick}
            >
                {playing ? <MdPause /> : <MdPlayArrow />}
            </span>
        )
    }
}