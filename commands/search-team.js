const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const DiscordUtils = require('../helpers/DiscordUtils');
const season = process.env.SEASON;
const statsChannelIds = process.env.STATS_CHANNEL_ID ? process.env.STATS_CHANNEL_ID.split(',').map(id => id.trim()) : [];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search-team')
		.setDescription('Search for a team by name')
		.addStringOption(option =>
			option
				.setName('team_name')
				.setDescription('Team name (partial names work too)')
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
			const searchTerm = interaction.options.getString('team_name');
			const seasonId = interaction.options.getNumber('season') ?? season;

			const teams = await SupabaseHelper.searchTeams(searchTerm);

			if (!teams || teams.length === 0) {
				await interaction.editReply({
					content: `No teams found matching "${searchTerm}".`,
					ephemeral: true,
				});
				return;
			}

			// If only one team found, show it with action buttons
			if (teams.length === 1) {
				const team = teams[0];
				const message = [
					`**🏆 Team Found**`,
					'',
					`**Name:** ${team.name}`,
					`**Team ID:** \`${team.id}\``,
					'',
					`💡 Use the buttons below to view statistics:`,
				].join('\n');

				const performanceButton = new ButtonBuilder()
					.setCustomId(DiscordUtils.createStatsButtonId(DiscordUtils.STATS_TEAM_PERFORMANCE_PREFIX, team.id, seasonId))
					.setLabel('View Performance')
					.setStyle(ButtonStyle.Primary);

				const topPicksButton = new ButtonBuilder()
					.setCustomId(DiscordUtils.createStatsButtonId(DiscordUtils.STATS_TOP_PICKS_PREFIX, team.id, seasonId))
					.setLabel('View Top Picks')
					.setStyle(ButtonStyle.Secondary);

				const buttonRow = new ActionRowBuilder().addComponents(performanceButton, topPicksButton);

				await interaction.editReply({ content: message, components: [buttonRow] });
			} else {
				// Multiple teams found, display a list
				const teamList = teams
					.map(team => `• **${team.name}** - ID: \`${team.id}\``)
					.join('\n');

				const message = [
					`**🔍 Found ${teams.length} Teams**`,
					'',
					teamList,
					'',
					`💡 **Narrow your search** or use a Team ID with commands like:`,
					`• \`/team-performance <team-id>\``,
					`• \`/top-picks <team-id>\``,
				].join('\n');

				await interaction.editReply({ content: message });
			}

		} catch (error) {
			console.error('search-team command error:', error);
			await interaction.editReply({
				content: 'Failed to search for teams: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

