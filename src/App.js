import React, { Component } from 'react';
import './App.css';
import InteractiveTranscript from './interactiveTranscript'


class App extends Component {
  render() {
    return (
      <div className="App">
        {/* <InteractiveTranscript mediaSource={'Big Think: Leland Melvin.mkv'} /> */}
        <InteractiveTranscript mediaSource={'two_min.mp4'} />
        {/* <InteractiveTranscript mediaSource={'audio.m4a'} /> */}
      </div>
    );
  }
}

export default App;
