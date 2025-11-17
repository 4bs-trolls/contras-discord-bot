function formatPlayerHistory(result, limit = 15) {
	const gamesToShow = result.games.slice(0, limit);
	const historyText = gamesToShow
		.map((game) => `• **Week ${game.week}** - ${game.machine}: \`${game.score.toLocaleString('en-US')}\` (${game.points} pts vs ${game.opponent})`)
		.join('\n');
	
	return [
		`**📜 Player History - ${result.playerName}**`,
		'',
		`**Season:** ${result.seasonId} | **Total Games:** ${result.games.length}`,
		`**Showing:** ${gamesToShow.length} most recent games`,
		'',
		historyText,
	].join('\n');
}

function formatMachineAverage(result) {
	return [
		`**📊 Machine Average Statistics**`,
		'',
		`**Machine:** ${result.machine}`,
		`**Average Score:** \`${result.averageScore.toLocaleString('en-US')}\``,
		`**Games Played:** ${result.gamesPlayed}`,
		`**Season:** ${result.seasonId}`,
	].join('\n');
}

function formatMachineLeaderboard(result) {
	const scoresText = result.scores
		.map((score, index) => {
			const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
			return `${medal} **${score.playerName}**: \`${score.score.toLocaleString('en-US')}\` (Week ${score.week})`;
		})
		.join('\n');

	return [
		`**🏆 Machine Leaderboard - ${result.machine}**`,
		'',
		`**Season:** ${result.seasonId} | **Top ${result.scores.length} Scores**`,
		'',
		scoresText,
	].join('\n');
}

function formatTeamPerformance(result) {
	return [
		`**🎯 Team Performance - Season ${result.seasonId}**`,
		'',
		`**Team:** ${result.teamId}`,
		`**Matches Played:** ${result.matchesPlayed}`,
		`**Total Points:** ${result.totalPoints}`,
		`**Average Per Match:** \`${result.averagePointsPerMatch}\``,
	].join('\n');
}

function formatTopPicks(result, limit = 10) {
	const machinesToShow = result.machines.slice(0, limit);
	const machinesText = machinesToShow
		.map((machine, index) => {
			const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
			const plural = machine.pickCount === 1 ? 'time' : 'times';
			
			// Add average score if available
			const avgText = machine.teamAverage 
				? ` | Avg: \`${machine.teamAverage.toLocaleString('en-US')}\`` 
				: '';
			
			return `${medal} **${machine.machineName}**: \`${machine.pickCount}\` ${plural}${avgText}`;
		})
		.join('\n');

	return [
		`**🎰 Top Machine Picks**`,
		'',
		`**Team:** ${result.teamId} | **Season:** ${result.seasonId}`,
		`**Showing:** Top ${machinesToShow.length} most picked machines`,
		'',
		machinesText,
	].join('\n');
}

module.exports = {
	formatPlayerHistory,
	formatMachineAverage,
	formatMachineLeaderboard,
	formatTeamPerformance,
	formatTopPicks,
};


