import React, { Component } from 'react';
import './App.css';
import InteractiveTranscript from './interactiveTranscript'


class App extends Component {
  render() {
    return (
      <div className="App">
        <InteractiveTranscript mediaSource={'Big Think: Leland Melvin.webm'} />
        {/* <InteractiveTranscript mediaSource={'fifty_min.mp4'} /> */}
        {/* <InteractiveTranscript mediaSource={'two_min.mp3'} /> */}
        {/* <InteractiveTranscript mediaSource={'audio.m4a'} /> */}
      </div>
    );
  }
}

export default App;
