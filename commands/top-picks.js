const { SlashCommandBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const MessageFormatter = require('../helpers/MessageFormatter');
const season = process.env.SEASON;
const statsChannelIds = process.env.STATS_CHANNEL_ID ? process.env.STATS_CHANNEL_ID.split(',').map(id => id.trim()) : [];
const captainStatsChannelIds = process.env.CAPTAIN_STATS_CHANNEL_ID ? process.env.CAPTAIN_STATS_CHANNEL_ID.split(',').map(id => id.trim()) : [];
const captainRoleId = process.env.CAPTAIN_ROLE_ID;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('top-picks')
		.setDescription('View machines an opposing team picks most frequently')
		.addStringOption(option =>
			option
				.setName('team_id')
				.setDescription('Team ID (use /search-team to find the ID)')
				.setRequired(true))
		.addNumberOption(option =>
			option
				.setName('season')
				.setDescription('Season ID (defaults to current season, use 0 for all-time)')
				.setRequired(false))
		.addNumberOption(option =>
			option
				.setName('limit')
				.setDescription('Number of machines to show (default 10, max 25)')
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
			const teamId = interaction.options.getString('team_id');
			const seasonId = interaction.options.getNumber('season') ?? season;
			let limit = interaction.options.getNumber('limit') || 10;
			limit = Math.min(limit, 25); // Cap at 25

			const result = await SupabaseHelper.getTopPickedMachines(teamId, seasonId);

			if (!result || !result.machines || result.machines.length === 0) {
				await interaction.editReply({
					content: `No machine selection data found for team "${teamId}" in season ${seasonId}.`,
					ephemeral: true,
				});
				return;
			}

			const message = MessageFormatter.formatTopPicks(result, limit);

			await interaction.editReply({ content: message });

		} catch (error) {
			console.error('top-picks command error:', error);
			await interaction.editReply({
				content: 'Failed to retrieve top picks: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

