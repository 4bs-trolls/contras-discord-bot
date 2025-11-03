const { SlashCommandBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const { stripIndent } = require('common-tags');
const season = process.env.SEASON;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('View top players by average score')
		.addNumberOption(option =>
			option
				.setName('season')
				.setDescription('Season ID (defaults to current season)')
				.setRequired(false))
		.addNumberOption(option =>
			option
				.setName('limit')
				.setDescription('Number of players to show (default 10, max 25)')
				.setRequired(false)),
	async execute(interaction) {
		try {
			const seasonId = interaction.options.getNumber('season') || season;
			let limit = interaction.options.getNumber('limit') || 10;
			limit = Math.min(limit, 25); // Cap at 25

			const leaderboard = await SupabaseHelper.getLeaderboard(seasonId, limit);

			if (!leaderboard || leaderboard.length === 0) {
				await interaction.reply({
					content: `No leaderboard data found for season ${seasonId}.`,
					ephemeral: true,
				});
				return;
			}

			const leaderboardText = leaderboard
				.map((player, index) => `${index + 1}. ${player.playerName}: ${player.averageScore.toLocaleString('en-US')} avg (${player.gamesPlayed} games)`)
				.join('\n');

			const message = stripIndent(`
				**Leaderboard - Season ${seasonId}**
				Top ${leaderboard.length} Players by Average Score

				${leaderboardText}
			`);

			await interaction.reply({ content: message, ephemeral: true });

		} catch (error) {
			console.error('leaderboard command error:', error);
			await interaction.reply({
				content: 'Failed to retrieve leaderboard: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

