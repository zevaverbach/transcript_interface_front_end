This is an interactive transcript implemented in React.  It takes in machine transcripts and will soon have functionality to present them to a human for correction.

Currently, the media file and transcript sources are hardcoded, and the performance is a little sluggish.

## Installation

* clone this repo
* `npm install`

## Usage

This runs out of the box using an included media file and JSON transcript.

```npm start```

Alternatively, to render an interactive transcript of your own files,

* Replace `audio.m4a` in the `public` folder with your own recording.
* Replace `transcript.json` in the `src` folder with your own transcript.  Currently it must be in the format provided by [Speechmatics](https://speechmatics.com).

## Features

* Click a word to jump to that spot in the associated media file.
* Words are highlighted as they're spoken.
* Seek to a position in the media file, and the word highlighting will adjust accordingly.

## Roadmap

See [issues](https://github.com/zevaverbach/react_interactive_transcript/issues).
