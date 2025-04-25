import { useEffect, useRef } from 'react'

const Pong = () => {
  const canvasRef = useRef(null)
  const keysDownRef = useRef({}) // ✅ replaces global keysDown
  const animationRef = useRef(null) // for canceling animation later


  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width = 1200
    const height = canvas.height = 800

    // 🎾 Drop your pong.js logic in here (or call a setupGame(ctx))
    // Example: draw a black background
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Controls
    const handleKeyDown = (e) => { keysDownRef.current[e.code] = true }
    const handleKeyUp = (e) => { delete keysDownRef.current[e.code] }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      cancelAnimationFrame(animationRef.current)
    }
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
    <h1 className="text-4xl font-bold text-pink-400 mb-6 neon-text">Pong</h1>
    <canvas
      ref={canvasRef}
      className="border-4 border-pink-500 bg-black"
    />
  </div>
  )
}

export default Pong