import React, { Component, Fragment } from 'react';


class Word extends Component {
    onClick = () => this.props.onClick(this.props.time)
    render() {
        return (
            <Fragment>
                <span>{this.props.space}</span>
                <span
                    onClick={this.onClick}
                    style={this.props.style}>{this.props.text}</span>

            </Fragment>
        )
    }
}

export default Word;