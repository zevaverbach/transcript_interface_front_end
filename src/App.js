import React, { Component } from 'react';
import './App.css';
import InteractiveTranscript from './interactiveTranscript'


class App extends Component {

	state = {
		password: '$pbkdf2-sha256$200000$A8DYG6M0plSKcQ5hzJlzDg$VG1lyV.4/ILqHgrLzd0XgPTWya/gZd9QiQAMOA0e91s',
		username: 'zev@averba.ch',
		transcriptID: 9,
		mediaSource: 'https://www.dropbox.com/s/qzvsuugul4yet2a/Big%20Think%3A%20Leland%20Melvin.webm?dl=1',
		isLoading: true,
	}

	componentDidMount() {
		this.getCredentialsAndAssets();
		this.setState({isLoading: false})
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
		const { username, password, transcriptID, mediaSource, isLoading } = this.state

		if (isLoading) {
			return <div className="App">Loading...</div>
		} else {
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
}

export default App;
