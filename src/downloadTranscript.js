import React from 'react'
import { FiDownload } from "react-icons/fi";


export default class DownloadTranscript extends React.Component {

    constructor(props) {
        super(props)
        this.downloadButton = React.createRef()
    }

    render() {
        return (
            <span
                title='Download transcript'
                ref={this.downloadButton}
                onClick={this.props.onClick}
                style={{ cursor: 'pointer' }}>
                <FiDownload />
            </span>
        )
    }
}