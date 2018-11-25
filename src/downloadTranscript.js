
import React from 'react';
import { endsSentence } from './helpers'



export const DownloadTranscript = ({ transcript, title }) => {

    const makeTranscriptTxt = transcript => {
        let count = 0
        let transcriptTxt = ''
        for (let word of transcript) {
            count++
            transcriptTxt += `${word.puncBefore ? word.puncBefore.join('') : ''}${word.word}${word.puncAfter ? word.puncAfter.join('') : ''} `
            if (count >= 80 && word.puncAfter && endsSentence(word.puncAfter.slice(-1)[0])) {
                count = 0
                transcriptTxt += '\n\n';
            }
        }
        return transcriptTxt
    }

    const transcriptTxt = makeTranscriptTxt(transcript)

    const _downloadTxtFile = () => {
        var element = document.createElement("a");
        var file = new Blob([transcriptTxt], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = title;
        element.click();
    }

    return (
        <div>
            <button id="download-transcript" onClick={_downloadTxtFile}>Download {title}</button>
        </div>
    );
}
