const { SlashCommandBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const season = process.env.SEASON;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('avg-game')
		.setDescription('Get average score for a pinball machine')
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
			await interaction.deferReply({ ephemeral: true });
			const machineId = interaction.options.getString('machine_id');
			const seasonId = interaction.options.getNumber('season') ?? season;

			const result = await SupabaseHelper.getAverageScoreForMachine(machineId, seasonId);

			if (!result) {
				await interaction.editReply({
					content: `No data found for machine "${machineId}" in season ${seasonId}. Make sure you're using the machine ID (e.g., "afm", "mm", etc.).`,
					ephemeral: true,
				});
				return;
			}

			const message = [
				`**📊 Machine Average Statistics**`,
				'',
				`**Machine:** ${result.machine}`,
				`**Average Score:** \`${result.averageScore.toLocaleString('en-US')}\``,
				`**Games Played:** ${result.gamesPlayed}`,
				`**Season:** ${result.seasonId}`,
			].join('\n');

			await interaction.editReply({ content: message, ephemeral: true });

		} catch (error) {
			console.error('avg-game command error:', error);
			await interaction.editReply({
				content: 'Failed to retrieve machine statistics: ' + error.message,
				ephemeral: true,
			});
		}
	},
};

