This is an interactive transcript implemented in React.

Currently, the media file and transcript are hardcoded, and the performance is a little sluggish.

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
* Seek to a position in the media file, and the word highlighting will adjust accordingly.

## Roadmap

### Improve performance

* Iterating through the entire transcript on each render is probably one bottleneck.
* Manipulating the media player via a DOM selector is probably not ideal.