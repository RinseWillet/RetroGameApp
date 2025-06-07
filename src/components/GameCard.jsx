import PropTypes from "prop-types";
import { gameCardClass } from '../styles/gameCardStyles';

const GameCard = ({ title, description, onClick }) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex="0"
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={gameCardClass}
    >
      <h3 className={gameCardTitleClass}>{title}</h3>
      <p className={gameCardDescriptionClass}>{description}</p>
    </div>
  )
}

GameCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
}

export default GameCard