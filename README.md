This is an interactive transcript implemented in React.

Currently, the media file and transcript are hardcoded, and the performance is a little sluggish.

## Features

* Click a word to jump to that spot in the associated media file.
* Seek to a position in the media file, and the word highlighting will adjust accordingly.

## Roadmap

* Improve performance
  * Iterating through the entire transcript on each render is probably one bottleneck.
  * Manipulating the media player via a DOM selector is probably not ideal.