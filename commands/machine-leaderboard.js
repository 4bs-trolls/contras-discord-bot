const { SlashCommandBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const MessageFormatter = require('../helpers/MessageFormatter');
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
			await interaction.deferReply({ ephemeral: true });
			const machineId = interaction.options.getString('machine_id');
			const seasonId = interaction.options.getNumber('season') ?? season;
			let limit = interaction.options.getNumber('limit') || 10;
			limit = Math.min(limit, 25); // Cap at 25

			const result = await SupabaseHelper.getMachineLeaderboard(machineId, seasonId, limit);

			if (!result || !result.scores || result.scores.length === 0) {
				await interaction.editReply({
					content: `No scores found for machine "${machineId}" in season ${seasonId}.`,
					ephemeral: true,
				});
				return;
			}

			const message = MessageFormatter.formatMachineLeaderboard(result);

			await interaction.editReply({ content: message, ephemeral: true });

		} catch (error) {
			console.error('machine-leaderboard command error:', error);
			await interaction.editReply({
				content: 'Failed to retrieve machine leaderboard: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

