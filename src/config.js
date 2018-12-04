
export const CONFIDENCE_THRESHOLD = .87
export const test = true
export let transcriptEndpoint
if (test) {
    transcriptEndpoint = 'http://localhost:5000/transcript?transcript_id=3'
} else {
    transcriptEndpoint = 'https://4ff024a0.ngrok.io/transcript?transcript_id=11'
}
export const transcriptPostEndpoint = 'https://4ff024a0.ngrok.io/transcript'