const GameCard = ({ title, description, onClick }) => {
    return (
      <div
        onClick={onClick}
        className="cursor-pointer bg-black border border-pink-500 p-6 rounded-xl hover:bg-pink-900/20 hover:scale-105 transition-all duration-300 text-center shadow-md shadow-pink-800/30"
      >
        <h3 className="text-pink-400 text-xl font-bold mb-2 neon-text">{title}</h3>
        <p className="text-pink-200 text-sm">{description}</p>
      </div>
    )
  }
  
  export default GameCard