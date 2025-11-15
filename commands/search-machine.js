const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const DiscordUtils = require('../helpers/DiscordUtils');
const season = process.env.SEASON;

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
			await interaction.deferReply({ ephemeral: true });
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

				await interaction.editReply({ content: message, components: [buttonRow], ephemeral: true });
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

				await interaction.editReply({ content: message, ephemeral: true });
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

