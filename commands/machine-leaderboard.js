const { SlashCommandBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const MessageFormatter = require('../helpers/MessageFormatter');
const season = process.env.SEASON;
const statsChannelIds = process.env.STATS_CHANNEL_ID ? process.env.STATS_CHANNEL_ID.split(',').map(id => id.trim()) : [];
const captainStatsChannelIds = process.env.CAPTAIN_STATS_CHANNEL_ID ? process.env.CAPTAIN_STATS_CHANNEL_ID.split(',').map(id => id.trim()) : [];
const captainRoleId = process.env.CAPTAIN_ROLE_ID;

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
			const isCaptain = captainRoleId && interaction.member?.roles.cache.has(captainRoleId);
			const allowedChannels = isCaptain ? [...statsChannelIds, ...captainStatsChannelIds] : statsChannelIds;

			if (!allowedChannels.includes(interaction.channelId)) {
				const channelMentions = allowedChannels.map(id => `<#${id}>`).join(', ');
				await interaction.reply({
					content: `This command can only be used in the following channels: ${channelMentions}.`,
					ephemeral: true,
				});
				return;
			}

			await interaction.deferReply();
			const machineId = interaction.options.getString('machine_id');
			const seasonId = interaction.options.getNumber('season') ?? season;
			let limit = interaction.options.getNumber('limit') || 10;
			// Cap at 25
			limit = Math.min(limit, 25);

			const result = await SupabaseHelper.getMachineLeaderboard(machineId, seasonId, limit);

			if (!result || !result.scores || result.scores.length === 0) {
				await interaction.editReply({
					content: `No scores found for machine "${machineId}" in season ${seasonId}.`,
					ephemeral: true,
				});
				return;
			}

			const message = MessageFormatter.formatMachineLeaderboard(result);

			await interaction.editReply({ content: message });

		} catch (error) {
			console.error('machine-leaderboard command error:', error);
			await interaction.editReply({
				content: 'Failed to retrieve machine leaderboard: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

