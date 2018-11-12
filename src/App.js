import React, { Component } from 'react';
import './App.css';
import InteractiveTranscript from './interactiveTranscript'


class App extends Component {
  render() {
    return (
      <div className="App">
        {/* <InteractiveTranscript mediaSource={'video.mkv'} /> */}
        <InteractiveTranscript mediaSource={'audio.m4a'} />
      </div>
    );
  }
}

export default App;
