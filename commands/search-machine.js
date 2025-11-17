const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const DiscordUtils = require('../helpers/DiscordUtils');
const season = process.env.SEASON;
const statsChannelIds = process.env.STATS_CHANNEL_ID ? process.env.STATS_CHANNEL_ID.split(',').map(id => id.trim()) : [];
const captainStatsChannelIds = process.env.CAPTAIN_STATS_CHANNEL_ID ? process.env.CAPTAIN_STATS_CHANNEL_ID.split(',').map(id => id.trim()) : [];
const captainRoleId = process.env.CAPTAIN_ROLE_ID;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search-machine')
		.setDescription('Search for a pinball machine by name')
		.addStringOption(option =>
			option
				.setName('machine_name')
				.setDescription('Machine name (partial names work too)')
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
			const searchTerm = interaction.options.getString('machine_name');
			const seasonId = interaction.options.getNumber('season') ?? season;

			const machines = await SupabaseHelper.searchMachines(searchTerm);

			if (!machines || machines.length === 0) {
				await interaction.editReply({
					content: `No machines found matching "${searchTerm}".`,
					ephemeral: true,
				});
				return;
			}

			// If only one machine found, show it with action buttons
			if (machines.length === 1) {
				const machine = machines[0];
				const message = [
					`**🎰 Machine Found**`,
					'',
					`**Name:** ${machine.name}`,
					`**Machine ID:** \`${machine.id}\``,
					'',
					`💡 Use the buttons below to view statistics:`,
				].join('\n');

				const avgButton = new ButtonBuilder()
					.setCustomId(DiscordUtils.createStatsButtonId(DiscordUtils.STATS_MACHINE_AVG_PREFIX, machine.id, seasonId))
					.setLabel('View Average Score')
					.setStyle(ButtonStyle.Primary);

				const leaderboardButton = new ButtonBuilder()
					.setCustomId(DiscordUtils.createStatsButtonId(DiscordUtils.STATS_MACHINE_LEADERBOARD_PREFIX, machine.id, seasonId))
					.setLabel('View Leaderboard')
					.setStyle(ButtonStyle.Secondary);

				const buttonRow = new ActionRowBuilder().addComponents(avgButton, leaderboardButton);

				await interaction.editReply({ content: message, components: [buttonRow] });
			} else {
				// Multiple machines found, display a list
				const machineList = machines
					.map(machine => `• **${machine.name}** - ID: \`${machine.id}\``)
					.join('\n');

				const message = [
					`**🔍 Found ${machines.length} Machines**`,
					'',
					machineList,
					'',
					`💡 **Narrow your search** or use a Machine ID with commands like:`,
					`• \`/avg-game <machine-id>\``,
					`• \`/machine-leaderboard <machine-id>\``,
				].join('\n');

				await interaction.editReply({ content: message });
			}

		} catch (error) {
			console.error('search-machine command error:', error);
			await interaction.editReply({
				content: 'Failed to search for machines: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

