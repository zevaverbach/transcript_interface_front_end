import React, { Component } from 'react';


class ConfidenceSlider extends Component {

    state = {
        value: 0,
    }

    handleChange = event => {
        this.props.onChange(event.target.value);
        this.setState({ value: event.target.value })
    }
    render() {
        return (
            <input type='range'
                min='0'
                max='.99'
                step='.01'
                value={this.state.value}
                onChange={this.handleChange}></input>
        )
    }
}

export default ConfidenceSlider;