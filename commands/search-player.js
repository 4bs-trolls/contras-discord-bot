const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const DiscordUtils = require('../helpers/DiscordUtils');
const season = process.env.SEASON;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search-player')
		.setDescription('Search for a player by name')
		.addStringOption(option =>
			option
				.setName('player_name')
				.setDescription('Player name (partial names work too)')
				.setRequired(true))
		.addNumberOption(option =>
			option
				.setName('season')
				.setDescription('Season ID (defaults to current season, use 0 for all-time)')
				.setRequired(false)),
	async execute(interaction) {
		try {
			const searchTerm = interaction.options.getString('player_name');
			const seasonId = interaction.options.getNumber('season') ?? season;

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
				const message = [
					`**🎯 Player Found**`,
					'',
					`**Name:** ${player.name}`,
					`**Player ID:** \`${player.id}\``,
					`**IPR:** ${player.ipr || 'N/A'}`,
					'',
					`💡 Use the buttons below to view statistics:`,
				].join('\n');

				const historyButton = new ButtonBuilder()
					.setCustomId(DiscordUtils.createStatsButtonId(DiscordUtils.STATS_PLAYER_HISTORY_PREFIX, player.id, seasonId))
					.setLabel('View History')
					.setStyle(ButtonStyle.Primary);

				const buttonRow = new ActionRowBuilder().addComponents(historyButton);

				await interaction.reply({ content: message, components: [buttonRow], ephemeral: true });
			} else {
				// Multiple players found, display a list
				const playerList = players
					.map(player => `• **${player.name}** - ID: \`${player.id}\` | IPR: ${player.ipr || 'N/A'}`)
					.join('\n');

				const message = [
					`**🔍 Found ${players.length} Players**`,
					'',
					playerList,
					'',
					`💡 **Narrow your search** or use a Player ID with commands like:`,
					`• \`/player-history <player-id>\``,
					`• \`/player-machine-avg <player-id> <machine-id>\``,
				].join('\n');

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

