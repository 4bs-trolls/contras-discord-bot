const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const DiscordUtils = require('../helpers/DiscordUtils');
const { stripIndent } = require('common-tags');
const season = process.env.SEASON;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search-player')
		.setDescription('Search for a player by name')
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('Player name to search for')
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

			const players = await SupabaseHelper.searchPlayers(searchTerm);

			if (!players || players.length === 0) {
				await interaction.reply({
					content: `No players found matching "${searchTerm}".`,
					ephemeral: true,
				});
				return;
			}

			// If only one player found, show it with action buttons
			if (players.length === 1) {
				const player = players[0];
				const message = stripIndent(`
					**Player Found**
					Name: ${player.name}
					Player ID: \`${player.id}\`
					IPR: ${player.ipr || 'N/A'}

					Use the buttons below to view statistics for this player:
				`);

				const historyButton = new ButtonBuilder()
					.setCustomId(DiscordUtils.createStatsButtonId(DiscordUtils.STATS_PLAYER_HISTORY_PREFIX, player.id, seasonId))
					.setLabel('View History')
					.setStyle(ButtonStyle.Primary);

				const buttonRow = new ActionRowBuilder().addComponents(historyButton);

				await interaction.reply({ content: message, components: [buttonRow], ephemeral: true });
			} else {
				// Multiple players found, display a list
				const playerList = players
					.map(player => `• ${player.name} (ID: \`${player.id}\`, IPR: ${player.ipr || 'N/A'})`)
					.join('\n');

				const message = stripIndent(`
					**Found ${players.length} Players**
					${playerList}

					Try searching again with a more specific name, or use the Player ID with commands like:
					\`/player-history <player-id>\`
					\`/player-machine-avg <player-id> <machine-id>\`
				`);

				await interaction.reply({ content: message, ephemeral: true });
			}

		} catch (error) {
			console.error('search-player command error:', error);
			await interaction.reply({
				content: 'Failed to search for players: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

