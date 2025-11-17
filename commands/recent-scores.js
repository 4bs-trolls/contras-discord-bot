const { SlashCommandBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const statsChannelIds = process.env.STATS_CHANNEL_ID ? process.env.STATS_CHANNEL_ID.split(',').map(id => id.trim()) : [];
const captainStatsChannelIds = process.env.CAPTAIN_STATS_CHANNEL_ID ? process.env.CAPTAIN_STATS_CHANNEL_ID.split(',').map(id => id.trim()) : [];
const captainRoleId = process.env.CAPTAIN_ROLE_ID;

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
			let limit = interaction.options.getNumber('limit') || 10;
			// Cap at 25
			limit = Math.min(limit, 25);

			const scores = await SupabaseHelper.getRecentScores(machineId, limit);

			if (!scores || scores.length === 0) {
				await interaction.editReply({
					content: `No recent scores found for machine "${machineId}".`,
					ephemeral: true,
				});
				return;
			}

			const scoresText = scores
				.map(score => `• **Week ${score.week}** - ${score.playerName}: \`${score.score.toLocaleString('en-US')}\``)
				.join('\n');

			const message = [
				`**🕐 Recent Scores - ${scores[0].machine}**`,
				'',
				`**Showing:** ${scores.length} most recent scores`,
				'',
				scoresText,
			].join('\n');

			await interaction.editReply({ content: message });

		} catch (error) {
			console.error('recent-scores command error:', error);
			await interaction.editReply({
				content: 'Failed to retrieve recent scores: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

