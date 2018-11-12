import React, { Component } from 'react';
import { style } from './App.css'


export default class editModal extends Component {

    state = {
        enterPressed: false,
    }

    onKeyUp = event => {
        if (!this.state.enterPressed) {
            this.setState({ enterPressed: true })
        } else {
            this.props.onKeyUp(event)
        }
    }

    render() {
        return (
            <div className='modal'>
                <div className='modal-main'>
                    <input
                        autoFocus
                        onChange={this.props.onChange}
                        onKeyUp={this.onKeyUp}
                        onFocus={(event) => { document.execCommand('selectall') }}
                        value={this.props.value}>
                    </input>
                </div>
            </div>
        )
    }
}