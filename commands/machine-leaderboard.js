const { SlashCommandBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const { stripIndent } = require('common-tags');
const season = process.env.SEASON;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('machine-leaderboard')
		.setDescription('View top scores on a specific machine')
		.addStringOption(option =>
			option
				.setName('machine_id')
				.setDescription('Machine ID (use /search-machine to find the ID)')
				.setRequired(true))
		.addNumberOption(option =>
			option
				.setName('season')
				.setDescription('Season ID (defaults to current season, use 0 for all-time)')
				.setRequired(false))
		.addNumberOption(option =>
			option
				.setName('limit')
				.setDescription('Number of scores to show (default 10, max 25)')
				.setRequired(false)),
	async execute(interaction) {
		try {
			const machineId = interaction.options.getString('machine_id');
			const seasonId = interaction.options.getNumber('season') ?? season;
			let limit = interaction.options.getNumber('limit') || 10;
			limit = Math.min(limit, 25); // Cap at 25

			const result = await SupabaseHelper.getMachineLeaderboard(machineId, seasonId, limit);

			if (!result || !result.scores || result.scores.length === 0) {
				await interaction.reply({
					content: `No scores found for machine "${machineId}" in season ${seasonId}.`,
					ephemeral: true,
				});
				return;
			}

			const scoresText = result.scores
				.map((score, index) => `${index + 1}. ${score.playerName}: ${score.score.toLocaleString('en-US')} (Week ${score.week})`)
				.join('\n');

			const message = stripIndent(`
				**Machine Leaderboard - ${result.machine}**
				Season: ${result.seasonId}
				Top ${result.scores.length} Scores

				${scoresText}
			`);

			await interaction.reply({ content: message, ephemeral: true });

		} catch (error) {
			console.error('machine-leaderboard command error:', error);
			await interaction.reply({
				content: 'Failed to retrieve machine leaderboard: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

