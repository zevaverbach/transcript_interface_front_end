import React, { Component } from 'react';
import './App.css';
import InteractiveTranscript from './interactiveTranscript'


class App extends Component {

	state = {
		password: null,
		username: null,
		transcriptID: null,
		mediaSource: null,
	}

	componentDidMount() {
		this.getCredentialsAndAssets();
	}

	get = which => {
		const itemValue = prompt(which + '?');
		localStorage.setItem(which, itemValue);
		return itemValue;
	}

	getCredentialsAndAssets = () => {
		['username', 'password', 'transcriptID', 'mediaSource'].forEach(itemName => {
			const itemValue = this.state[itemName] || localStorage.getItem(itemName) || this.get(itemName);
			this.setState({[itemName]: itemValue})
			  localStorage.setItem(itemName, itemValue)
		});
	}

  render() {
		const { username, password, transcriptID, mediaSource } = this.state
		return (
      <div className="App">
				{transcriptID && mediaSource && <InteractiveTranscript 
					password={password}
					username={username}
					transcriptID={transcriptID}
					mediaSource={mediaSource}
				/>}
      </div>
    );
  }
}

export default App;
