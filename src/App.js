import React, { Component } from 'react';
import './App.css';
import InteractiveTranscript from './interactiveTranscript'


class App extends Component {
  render() {
    return (
      <div className="App">
        <InteractiveTranscript mediaSource={'video.mkv'} />
      </div>
    );
  }
}

export default App;
