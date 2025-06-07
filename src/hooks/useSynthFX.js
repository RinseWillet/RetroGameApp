import { useRef } from 'react'
import { getAudioContext } from '../audio/audioCTX';

const useSynthFX = () => {
  const beep = (frequency = 440, volume = 1, type = 'sine', duration = 100) => {
    const audioCtx = getAudioContext();
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    gainNode.gain.value = volume
    oscillator.frequency.value = frequency
    oscillator.type = type

    oscillator.start()
    oscillator.stop(audioCtx.currentTime + (duration / 1000))
  }

  return { beep }
}

export default useSynthFX