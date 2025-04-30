// src/audio/audioCtx.js
let audioCtx;

export const getAudioContext = () => {
    if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
};