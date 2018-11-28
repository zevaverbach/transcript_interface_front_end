
import React from 'react';
import { endsSentence, secondsTohhmmss } from './helpers'
import { MdFileDownload } from 'react-icons/md';



export const DownloadTranscript = ({ transcript, title }) => {

    const makeTranscriptTxt = transcript => {
        let count = 0
        let transcriptTxt = `${secondsTohhmmss(transcript[0].start)}\n`
        for (let [index, word] of transcript.entries()) {
            count++
            transcriptTxt += `${word.puncBefore ? word.puncBefore.join('') : ''}${word.word}${word.puncAfter ? word.puncAfter.join('') : ''} `
            if (count >= 80 && word.puncAfter && endsSentence(word.puncAfter.slice(-1)[0])) {
                count = 0
                transcriptTxt += '\n\n';
                if (transcript[index + 1]) {
                    transcriptTxt += `${secondsTohhmmss(transcript[index + 1].start)}\n`
                }
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

    return <span title='Download transcript'

        style={{ cursor: 'pointer' }}
        onClick={_downloadTxtFile}><MdFileDownload /></span>
}
