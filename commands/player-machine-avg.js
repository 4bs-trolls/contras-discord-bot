const { SlashCommandBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const season = process.env.SEASON;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('player-machine-avg')
		.setDescription('Get a player\'s average score on a specific machine')
		.addStringOption(option =>
			option
				.setName('player_id')
				.setDescription('Player ID (use /search-player to find the ID)')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('machine_id')
				.setDescription('Machine ID (use /search-machine to find the ID)')
				.setRequired(true))
		.addNumberOption(option =>
			option
				.setName('season')
				.setDescription('Season ID (defaults to current season, use 0 for all-time)')
				.setRequired(false)),
	async execute(interaction) {
		try {
			const playerId = interaction.options.getString('player_id');
			const machineId = interaction.options.getString('machine_id');
			const seasonId = interaction.options.getNumber('season') ?? season;

			const result = await SupabaseHelper.getPlayerMachineAverage(playerId, machineId, seasonId);

			if (!result) {
				await interaction.reply({
					content: `No data found for player "${playerId}" on machine "${machineId}" in season ${seasonId}.`,
					ephemeral: true,
				});
				return;
			}

			const message = [
				`**📊 Player Machine Average**`,
				'',
				`**Player:** ${result.playerName}`,
				`**Machine:** ${result.machine}`,
				`**Average Score:** \`${result.averageScore.toLocaleString('en-US')}\``,
				`**Games Played:** ${result.gamesPlayed}`,
				`**Season:** ${result.seasonId}`,
			].join('\n');

			await interaction.reply({ content: message, ephemeral: true });

		} catch (error) {
			console.error('player-machine-avg command error:', error);
			await interaction.reply({
				content: 'Failed to retrieve player machine statistics: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

