import React, { Component } from 'react';
import * as Mousetrap from 'mousetrap';
import { hhmmssToSeconds } from './helpers';

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

        Mousetrap.bind(';', () => {
            this.state.player.playbackRate = 1;
            if (this.state.player.paused) {
                console.log(this.state.player.duration)
                console.log(this.state.player.currentTime)
                if (this.state.player.currentTime === this.state.player.duration) {
                    this.state.player.currentTime -= 1.65
                }
                this.state.player.play();
            } else {
                this.state.player.currentTime -= 1.65
            }
        });

        Mousetrap.bind('`', () => {
            this.state.player.pause();
            this.state.player.currentTime -= 1.65
            this.state.player.playbackRate = 1;
        });


        Mousetrap.bind('ctrl+;', () => {
            this.state.player.playbackRate = 5;
            if (this.state.player.paused) this.state.player.play();
        }, 'keydown');

        Mousetrap.bind('ctrl+;', () => {
            this.state.player.playbackRate = 1;
            this.state.player.play();
        }, 'keyup');

        Mousetrap.bind('ctrl+\'', () => {
            this.state.player.currentTime -= 10;
        });

        Mousetrap.bind('meta+j', () => {
            if (!this.state.player.paused) this.state.player.pause();
            const newPosition = hhmmssToSeconds(prompt('Jump to time: '))
            this.state.player.currentTime = newPosition
        });
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.updatePlayer
            && this.state.player
            && this.state.playPosition !== nextProps.playPosition
        ) {

            console.log(nextProps.playPosition)
            this.state.player.currentTime = nextProps.playPosition;
            this.setState({ playPosition: nextProps.playPosition })

        } else {

            if (this.props.updatePlayer
                && this.state.player
                && this.props.play) {

                if (this.state.player.paused) {
                    this.state.player.play()
                } else {
                    this.state.player.currentTime = this.state.player.currentTime - 1.65
                    this.setState({ currentTime: this.state.player.currentTime })
                }

            }
        }
    }

    onTimeUpdate = e => {
        if (this.state.player) {
            const playPosition = this.state.player.currentTime
            this.props.onTimeUpdate(playPosition)
        }
    }

    play = () => {
        if (this.state.player.paused) {
            this.state.player.play()
        } else {
            this.state.player.currentTime = this.state.player.currentTime - 1.5
            this.setState({ playPosition: this.state.player.currentTime })
        }
    }

    render() {
        if (this.state.mediaType === 'audio') {
            return (
                <audio
                    src={this.props.src}
                    onTimeUpdate={this.onTimeUpdate}
                    controls>
                </audio>
            )
        }
        return (
            <video
                src={this.props.src}
                onTimeUpdate={this.onTimeUpdate}
                controls>
            </video>
        )
    }
}

export default MediaPlayer;