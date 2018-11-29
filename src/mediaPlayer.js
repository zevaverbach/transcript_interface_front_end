import React, { Component } from 'react';
import * as Mousetrap from 'mousetrap';
import { hhmmssToSeconds } from './helpers/helpers';

class MediaPlayer extends Component {

    constructor(props) {
        super(props)
        this.player = React.createRef();
        this.state = {
            player: null,
            mediaType: ['.mp3', '.wav', '.m4a']
                .some(fileExtension => this.props.src.endsWith(fileExtension))
                ? 'audio'
                : 'video'
        }

    }

    componentDidMount() {

        const player = this.player.current
        const { stopPlayback, togglePlay } = this.props

        Mousetrap.bind(';', () => {
            player.playbackRate = 1;
            if (player.paused) {
                if (player.currentTime === player.duration) {
                    player.currentTime -= 1.65
                }
                togglePlay()
            } else {
                player.currentTime -= 1.65
            }
        });

        Mousetrap.bind('`', () => {
            stopPlayback()
            player.currentTime -= 1.65
            player.playbackRate = 1;
        });


        Mousetrap.bind(['ctrl+;', 'meta+;'], () => {
            player.playbackRate = 5;
            if (player.paused) this.props.togglePlay()
        }, 'keydown');

        Mousetrap.bind(['ctrl+;', 'meta+;'], () => {
            player.playbackRate = 1;
            player.play();
        }, 'keyup');

        Mousetrap.bind(['ctrl+\'', 'meta+\''], () => {
            player.currentTime -= 10;
        });

        Mousetrap.bind('meta+j', () => {
            if (!player.paused) player.pause();
            const newPosition = hhmmssToSeconds(prompt('Jump to time: '))
            player.currentTime = newPosition
        });
    }

    onTimeUpdate = e => {
        if (this.player) {
            const playPosition = this.player.current.currentTime
            this.props.onTimeUpdate(playPosition)
        }
    }

    render() {
        if (this.state.mediaType === 'audio') {
            return (
                <React.Fragment>
                    <audio
                        src={this.props.src}
                        ref={this.player}
                        onTimeUpdate={this.onTimeUpdate}
                        controlsList="nodownload"
                        controls
                    >
                    </audio>
                </React.Fragment>
            )
        }
        return (
            <React.Fragment>
                <video
                    src={this.props.src}
                    ref={this.player}
                    onTimeUpdate={this.onTimeUpdate}
                    controlsList={"nodownload nofullscreen"}
                    controls
                >
                </video>
            </React.Fragment>
        )
    }
}

export default MediaPlayer;