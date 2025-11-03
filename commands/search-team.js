const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const DiscordUtils = require('../helpers/DiscordUtils');
const { stripIndent } = require('common-tags');
const season = process.env.SEASON;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search-team')
		.setDescription('Search for a team by name')
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('Team name to search for')
				.setRequired(true))
		.addNumberOption(option =>
			option
				.setName('season')
				.setDescription('Season ID (defaults to current season)')
				.setRequired(false)),
	async execute(interaction) {
		try {
			const searchTerm = interaction.options.getString('name');
			const seasonId = interaction.options.getNumber('season') || season;

			const teams = await SupabaseHelper.searchTeams(searchTerm);

			if (!teams || teams.length === 0) {
				await interaction.reply({
					content: `No teams found matching "${searchTerm}".`,
					ephemeral: true,
				});
				return;
			}

			// If only one team found, show it with action buttons
			if (teams.length === 1) {
				const team = teams[0];
				const message = stripIndent(`
					**Team Found**
					Name: ${team.name}
					Team ID: \`${team.id}\`

					Use the buttons below to view statistics for this team:
				`);

				const performanceButton = new ButtonBuilder()
					.setCustomId(DiscordUtils.createStatsButtonId(DiscordUtils.STATS_TEAM_PERFORMANCE_PREFIX, team.id, seasonId))
					.setLabel('View Performance')
					.setStyle(ButtonStyle.Primary);

				const topPicksButton = new ButtonBuilder()
					.setCustomId(DiscordUtils.createStatsButtonId(DiscordUtils.STATS_TOP_PICKS_PREFIX, team.id, seasonId))
					.setLabel('View Top Picks')
					.setStyle(ButtonStyle.Secondary);

				const buttonRow = new ActionRowBuilder().addComponents(performanceButton, topPicksButton);

				await interaction.reply({ content: message, components: [buttonRow], ephemeral: true });
			} else {
				// Multiple teams found, display a list
				const teamList = teams
					.map(team => `• ${team.name} (ID: \`${team.id}\`)`)
					.join('\n');

				const message = stripIndent(`
					**Found ${teams.length} Teams**
					${teamList}

					Try searching again with a more specific name, or use the Team ID with commands like:
					\`/team-performance <team-id>\`
					\`/top-picks <team-id>\`
				`);

				await interaction.reply({ content: message, ephemeral: true });
			}

		} catch (error) {
			console.error('search-team command error:', error);
			await interaction.reply({
				content: 'Failed to search for teams: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

