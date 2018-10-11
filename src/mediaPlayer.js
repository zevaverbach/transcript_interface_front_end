import React, { Component } from 'react';


class MediaPlayer extends Component {

    state = {
        player: null,
        playPosition: 0,
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
        if (this.state.player
            && this.props.updatePlayer
            && this.state.playPosition !== nextProps.currentTime) {

            this.state.player.currentTime = nextProps.currentTime;
            this.setState({ playPosition: nextProps.currentTime })
        }
    }

    timeUpdate = e => {
        if (this.state.player) {
            const currentTime = this.state.player.currentTime
            this.props.timeUpdate(currentTime)
        }
    }
    render() {
        if (this.state.mediaType === 'audio') {
            return (
                <audio
                    src={this.props.src}
                    onPause={this.timeUpdate}
                    onPlay={this.timeUpdate}
                    onSeeked={this.timeUpdate}
                    onTimeUpdate={this.timeUpdate}
                    controls>
                </audio>
            )
        }
        return (
            <video
                src={this.props.src}
                onPause={this.timeUpdate}
                onPlay={this.timeUpdate}
                onSeeked={this.timeUpdate}
                onTimeUpdate={this.timeUpdate}
                controls>
            </video>
        )
    }
}

export default MediaPlayer;