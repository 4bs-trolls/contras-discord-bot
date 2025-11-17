const { SlashCommandBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const MessageFormatter = require('../helpers/MessageFormatter');
const season = process.env.SEASON;
const statsChannelIds = process.env.STATS_CHANNEL_ID ? process.env.STATS_CHANNEL_ID.split(',').map(id => id.trim()) : [];

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
			if (!statsChannelIds.includes(interaction.channelId)) {
				const channelMentions = statsChannelIds.map(id => `<#${id}>`).join(', ');
				await interaction.reply({
					content: `This command can only be used in the following channels: ${channelMentions}.`,
					ephemeral: true,
				});
				return;
			}

			await interaction.deferReply();
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

			const message = MessageFormatter.formatTeamPerformance(result);

			await interaction.editReply({ content: message });

		} catch (error) {
			console.error('team-performance command error:', error);
			await interaction.editReply({
				content: 'Failed to retrieve team performance: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

