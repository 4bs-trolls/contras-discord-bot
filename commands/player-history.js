const { SlashCommandBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const { stripIndent } = require('common-tags');
const season = process.env.SEASON;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('player-history')
		.setDescription('View a player\'s complete game history')
		.addStringOption(option =>
			option
				.setName('player')
				.setDescription('Player ID')
				.setRequired(true))
		.addNumberOption(option =>
			option
				.setName('season')
				.setDescription('Season ID (defaults to current season)')
				.setRequired(false))
		.addNumberOption(option =>
			option
				.setName('limit')
				.setDescription('Number of games to show (default 15, max 25)')
				.setRequired(false)),
	async execute(interaction) {
		try {
			const playerId = interaction.options.getString('player');
			const seasonId = interaction.options.getNumber('season') || season;
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
				.map((game, index) => `Week ${game.week}: ${game.machine} - ${game.score.toLocaleString('en-US')} pts (${game.points} points vs ${game.opponent})`)
				.join('\n');

			const message = stripIndent(`
				**Player History - ${result.playerName}**
				Season: ${result.seasonId}
				Total Games: ${result.games.length}
				Showing: ${gamesToShow.length} most recent games

				${historyText}
			`);

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

