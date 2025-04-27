import { useNavigate } from 'react-router-dom'
import GameCard from '../components/GameCard'

const Home = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-16">
      <h1 className="text-6xl font-extrabold text-pink-500 neon-text mb-8">
        Rinsecade
      </h1>

      <p className="text-center text-lg max-w-xl text-pink-200 mb-12">
        A synthwave arcade of retro games by Rinse Willet 🎮✨
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        <GameCard
          title="Pong"
          description="The original duel — retro tennis in digital form."
          onClick={() => navigate('/pong')}
        />
      </div>
    </div>
  )
}

export default Home