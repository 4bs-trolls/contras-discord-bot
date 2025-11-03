const { SlashCommandBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const { stripIndent } = require('common-tags');
const season = process.env.SEASON;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('team-performance')
		.setDescription('View team performance statistics')
		.addStringOption(option =>
			option
				.setName('team')
				.setDescription('Team ID (e.g., CDC)')
				.setRequired(true))
		.addNumberOption(option =>
			option
				.setName('season')
				.setDescription('Season ID (defaults to current season)')
				.setRequired(false)),
	async execute(interaction) {
		try {
			const teamId = interaction.options.getString('team');
			const seasonId = interaction.options.getNumber('season') || season;

			const result = await SupabaseHelper.getTeamPerformance(teamId, seasonId);

			if (!result) {
				await interaction.reply({
					content: `No performance data found for team "${teamId}" in season ${seasonId}.`,
					ephemeral: true,
				});
				return;
			}

			const message = stripIndent(`
				**Team Performance - Season ${result.seasonId}**
				Team ID: ${result.teamId}
				Matches Played: ${result.matchesPlayed}
				Total Points: ${result.totalPoints}
				Average Points Per Match: ${result.averagePointsPerMatch}
			`);

			await interaction.reply({ content: message, ephemeral: true });

		} catch (error) {
			console.error('team-performance command error:', error);
			await interaction.reply({
				content: 'Failed to retrieve team performance: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

