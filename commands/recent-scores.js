const { SlashCommandBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const { stripIndent } = require('common-tags');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('recent-scores')
		.setDescription('View the most recent scores on a specific machine')
		.addStringOption(option =>
			option
				.setName('machine_id')
				.setDescription('Machine ID (use /search-machine to find the ID)')
				.setRequired(true))
		.addNumberOption(option =>
			option
				.setName('limit')
				.setDescription('Number of scores to show (default 10, max 25)')
				.setRequired(false)),
	async execute(interaction) {
		try {
			const machineId = interaction.options.getString('machine_id');
			let limit = interaction.options.getNumber('limit') || 10;
			limit = Math.min(limit, 25); // Cap at 25

			const scores = await SupabaseHelper.getRecentScores(machineId, limit);

			if (!scores || scores.length === 0) {
				await interaction.reply({
					content: `No recent scores found for machine "${machineId}".`,
					ephemeral: true,
				});
				return;
			}

			const scoresText = scores
				.map(score => `Week ${score.week}: ${score.playerName} - ${score.score.toLocaleString('en-US')}`)
				.join('\n');

			const message = stripIndent(`
				**Recent Scores - ${scores[0].machine}**
				Showing ${scores.length} most recent scores

				${scoresText}
			`);

			await interaction.reply({ content: message, ephemeral: true });

		} catch (error) {
			console.error('recent-scores command error:', error);
			await interaction.reply({
				content: 'Failed to retrieve recent scores: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

