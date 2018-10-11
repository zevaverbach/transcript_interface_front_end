import React, { Component } from 'react';


class MediaPlayer extends Component {

    state = {
        player: null,
        playPosition: this.props.playPosition,
        mediaType: ['.mp3', '.wav', '.m4a']
            .some(fileExtension => this.props.src.endsWith(fileExtension))
            ? 'audio'
            : 'video'
    }


    componentDidMount() {
        const player = document.getElementsByTagName(this.state.mediaType)[0]
        this.setState({ player: player })
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.updatePlayer
            && this.state.player
            && this.state.playPosition !== nextProps.playPosition) {

            this.state.player.currentTime = nextProps.playPosition;
            this.setState({ playPosition: nextProps.playPosition})
            this.props.setUpdatePlayerFalse();
        }
    }

    onTimeUpdate = e => {
        if (this.state.player) {
            const playPosition = this.state.player.currentTime
            this.props.onTimeUpdate(playPosition)
        }
    }
    render() {
        if (this.state.mediaType === 'audio') {
            return (
                <audio
                    src={this.props.src}
                    onPause={this.onTimeUpdate}
                    onPlay={this.onTimeUpdate}
                    onSeeked={this.onTimeUpdate}
                    onTimeUpdate={this.onTimeUpdate}
                    controls>
                </audio>
            )
        }
        return (
            <video
                src={this.props.src}
                onPause={this.onTimeUpdate}
                onPlay={this.onTimeUpdate}
                onSeeked={this.onTimeUpdate}
                onTimeUpdate={this.onTimeUpdate}
                controls>
            </video>
        )
    }
}

export default MediaPlayer;