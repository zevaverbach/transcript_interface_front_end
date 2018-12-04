
export const changeQueueStep = (whichOne, transcript, steps) => {
    let t = { ...transcript }
    steps.forEach(step => {
        step.forEach(word => {
            if (whichOne !== 'undo') {
                t[word.start] = { ...word, changed: true }
            } else {
                t[word.start] = {
                    ...t[word.start],
                    ...t[word.start].prevState
                }
            }
        })
    })

    return t
}

export const insertQueueStep = (transcript, step) => {

    let prevInsertLength = 0,
        newSelectedWords, newSelectedWordIndex

    step.forEach(insertChunk => {
        const numWords = insertChunk.length

        transcript = transcript
            .slice(0, insertChunk[0].index + prevInsertLength).map(word => word)
            .concat(insertChunk
                .map(word => ({
                    ...word,
                    index: word.index + prevInsertLength,
                    key: word.index + prevInsertLength,
                    changed: true
                })))
            .concat(transcript.slice(insertChunk[0].index + prevInsertLength)
                .map(word => ({
                    ...word,
                    index: word.index + numWords,
                    key: word.index + numWords,
                })))

        let newSelectedWordsStartOffset = numWords - 1

        newSelectedWordIndex = insertChunk.slice(-1)[0].index - newSelectedWordsStartOffset

        newSelectedWords = {
            start: newSelectedWordIndex,
            offset: numWords - 1
        }

        prevInsertLength = numWords

    })

    return [transcript, newSelectedWords]

}

export const deleteQueueStep = (transcript, step) => {

    let prevDeleteLength = 0, newSelectedWords
    let lastIndexDeleted = step[0][0].index

    step.forEach(deleteChunk => {
        const numWords = deleteChunk.length
        const indicesToRemove = Array(numWords).fill()
            .map((_, i) => deleteChunk[0].index - prevDeleteLength + i)

        transcript = transcript
            .filter(word => !indicesToRemove.includes(word.index))
            .map(word => word.index > indicesToRemove[0]
                ? {
                    ...word,
                    index: word.index - numWords
                }
                : word)

        // only adjust indicesToRemove if the deletions are next to each other: to fix bug in surroundWithStuff
        if (indicesToRemove[0] - lastIndexDeleted === 1) prevDeleteLength = numWords

        newSelectedWords = { start: indicesToRemove[0] - 1, offset: numWords - 1 }

        lastIndexDeleted = indicesToRemove.slice(-1)[0]
    })
    return [transcript, newSelectedWords]
}