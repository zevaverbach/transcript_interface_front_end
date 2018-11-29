
import React, { Component } from 'react';
import { MdRefresh } from 'react-icons/md'


export default class MediaContainer extends Component {

    constructor(props) {
        super(props)
        this.undoAll = React.createRef()
    }

    render() {
        return (
            <span
                ref={this.undoAll}
                title="undo all changes" // Command or Windows and shift key icons
                style={this.props.greyed ? { color: '#BBB' } : { cursor: 'pointer' }}
                onClick={this.props.onClick}
            >
                <MdRefresh />
            </span>
        )
    }
    }