const { SlashCommandBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const season = process.env.SEASON;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('team-performance')
		.setDescription('View team performance statistics')
		.addStringOption(option =>
			option
				.setName('team_id')
				.setDescription('Team ID (use /search-team to find the ID)')
				.setRequired(true))
		.addNumberOption(option =>
			option
				.setName('season')
				.setDescription('Season ID (defaults to current season, use 0 for all-time)')
				.setRequired(false)),
	async execute(interaction) {
		try {
			await interaction.deferReply({ ephemeral: true });
			const teamId = interaction.options.getString('team_id');
			const seasonId = interaction.options.getNumber('season') ?? season;

			const result = await SupabaseHelper.getTeamPerformance(teamId, seasonId);

			if (!result) {
				await interaction.editReply({
					content: `No performance data found for team "${teamId}" in season ${seasonId}.`,
					ephemeral: true,
				});
				return;
			}

			const message = [
				`**🎯 Team Performance - Season ${result.seasonId}**`,
				'',
				`**Team:** ${result.teamId}`,
				`**Matches Played:** ${result.matchesPlayed}`,
				`**Total Points:** ${result.totalPoints}`,
				`**Average Per Match:** \`${result.averagePointsPerMatch}\``,
			].join('\n');

			await interaction.editReply({ content: message, ephemeral: true });

		} catch (error) {
			console.error('team-performance command error:', error);
			await interaction.editReply({
				content: 'Failed to retrieve team performance: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

