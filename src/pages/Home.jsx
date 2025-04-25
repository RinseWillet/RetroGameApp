const Home = () => {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-6xl font-extrabold text-pink-500 neon-text mb-8">
          Rinsecade
        </h1>
  
        <p className="text-center text-lg max-w-xl text-pink-200 mb-12">
          A synthwave arcade of retro games by Rinse Willet 🎮✨
        </p>
  
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="bg-pink-800/10 border border-pink-500 p-6 rounded-lg text-center hover:bg-pink-800/30 transition-all duration-300">
            Placeholder Game 1
          </div>
          <div className="bg-pink-800/10 border border-pink-500 p-6 rounded-lg text-center hover:bg-pink-800/30 transition-all duration-300">
            Placeholder Game 2
          </div>
        </div>
      </div>
    )
  }
  
  export default Home