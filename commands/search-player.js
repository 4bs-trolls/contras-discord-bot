const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const DiscordUtils = require('../helpers/DiscordUtils');
const season = process.env.SEASON;
const statsChannelIds = process.env.STATS_CHANNEL_ID ? process.env.STATS_CHANNEL_ID.split(',').map(id => id.trim()) : [];
const captainStatsChannelIds = process.env.CAPTAIN_STATS_CHANNEL_ID ? process.env.CAPTAIN_STATS_CHANNEL_ID.split(',').map(id => id.trim()) : [];
const captainRoleId = process.env.CAPTAIN_ROLE_ID;

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
			const searchTerm = interaction.options.getString('player_name');
			const seasonId = interaction.options.getNumber('season') ?? season;

			const players = await SupabaseHelper.searchPlayers(searchTerm);

			if (!players || players.length === 0) {
				await interaction.editReply({
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

				await interaction.editReply({ content: message, components: [buttonRow] });
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

				await interaction.editReply({ content: message });
			}

		} catch (error) {
			console.error('search-player command error:', error);
			await interaction.editReply({
				content: 'Failed to search for players: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

