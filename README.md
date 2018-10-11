This is an interface for a human to correct machine transcripts.

Currently, the media file and transcript sources are hardcoded, and the performance is a little sluggish.

## Installation

* clone this repo
* `npm install`

## Run

This runs out of the box using an included media file and JSON transcript.

```npm start```

Alternatively, to render an interactive transcript of your own files,

* Replace `audio.m4a` in the `public` folder with your own recording.
* Replace `transcript.json` in the `src` folder with your own transcript.  Currently it must be in the format provided by [Speechmatics](https://speechmatics.com).

## Features

* Click a word to jump to that spot in the associated media file.
* Words are highlighted as they're spoken.
* Seek to a position in the media file, and the word highlighting will adjust accordingly.
* Type a comma, and a comma is added after the currently highlighted word.
* Type a period, and a period is added after the currently highlighted word, and the first word of the following sentence is capitalized.
* Paragraphs are kept to ~80 words long, without truncating sentences, and are dynamically (reactively!) reorganized if an edit increases their size.

## Roadmap

See [issues](https://github.com/zevaverbach/react_interactive_transcript/issues).
