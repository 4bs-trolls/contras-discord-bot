const { SlashCommandBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const season = process.env.SEASON;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('player-history')
		.setDescription('View a player\'s complete game history')
		.addStringOption(option =>
			option
				.setName('player_id')
				.setDescription('Player ID (use /search-player to find the ID)')
				.setRequired(true))
		.addNumberOption(option =>
			option
				.setName('season')
				.setDescription('Season ID (defaults to current season, use 0 for all-time)')
				.setRequired(false))
		.addNumberOption(option =>
			option
				.setName('limit')
				.setDescription('Number of games to show (default 15, max 25)')
				.setRequired(false)),
	async execute(interaction) {
		try {
			const playerId = interaction.options.getString('player_id');
			const seasonId = interaction.options.getNumber('season') ?? season;
			let limit = interaction.options.getNumber('limit') || 15;
			limit = Math.min(limit, 25); // Cap at 25

			const result = await SupabaseHelper.getPlayerHistory(playerId, seasonId);

			if (!result || !result.games || result.games.length === 0) {
				await interaction.reply({
					content: `No game history found for player "${playerId}" in season ${seasonId}.`,
					ephemeral: true,
				});
				return;
			}

			// Limit the number of games displayed
			const gamesToShow = result.games.slice(0, limit);

			const historyText = gamesToShow
				.map((game) => `• **Week ${game.week}** - ${game.machine}: \`${game.score.toLocaleString('en-US')}\` (${game.points} pts vs ${game.opponent})`)
				.join('\n');

			const message = [
				`**📜 Player History - ${result.playerName}**`,
				'',
				`**Season:** ${result.seasonId} | **Total Games:** ${result.games.length}`,
				`**Showing:** ${gamesToShow.length} most recent games`,
				'',
				historyText,
			].join('\n');

			await interaction.reply({ content: message, ephemeral: true });

		} catch (error) {
			console.error('player-history command error:', error);
			await interaction.reply({
				content: 'Failed to retrieve player history: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

