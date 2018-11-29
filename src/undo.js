import React, { Component } from 'react'
import { MdUndo } from 'react-icons/md'


export default class Undo extends Component {

    constructor(props) {
        super(props)
        this.undoButton = React.createRef()
    }

    render() {
        return (
            <span
                ref={this.undoButton}
                title="undo (&#8984;/&#8862; + 'z')" // Command or Windows key icons
                style={this.props.greyed ? { color: '#BBB' } : { cursor: 'pointer' }}
                onClick={this.props.onClick}
            >
                <MdUndo />
            </span>
        )
    }
}