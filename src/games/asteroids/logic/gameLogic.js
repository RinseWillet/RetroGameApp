export const handleWaveEnd = (
	gameState,
	asteroidsState,
	canvas,
	currentHeartbeatIntervalRef,
	MAXINTERVAL,
	startHeartbeat,
	shipState
) => {
	const {startedRef, gameOverRef, waveRef} = gameState;
	const {invincible, invincibleTime} = shipState;
	const {asteroidsRef, initialAsteroidCountRef, createAsteroids} = asteroidsState;
	if (startedRef.current && asteroidsRef.current.length === 0 && !gameOverRef.current) {
		waveRef.current++;

		createAsteroids(canvas, asteroidsRef, waveRef, 5 + waveRef.current);
		initialAsteroidCountRef.current = asteroidsRef.current.length;

		//reset heartbeat
		currentHeartbeatIntervalRef.current = MAXINTERVAL;
		startHeartbeat();

		//short invincibility mode to avoid spawning kills
		invincible.current = true;
		invincibleTime.current = 180;
	}
};
