import React, { Component } from 'react'
import { MdRedo } from 'react-icons/md'


export default class Redo extends Component {

    constructor(props) {
        super(props)
        this.redoButton = React.createRef()
    }

    render() {

        return (
            <span
                ref={this.redoButton}
                title="redo (&#8984;/&#8862; + &#8679; + 'z')" // Command or Windows and shift key icons
                style={this.props.greyed ? { color: '#BBB' } : { cursor: 'pointer' }}
                onClick={this.props.onClick}
            >
                <MdRedo />
            </span>
        )
    }
}