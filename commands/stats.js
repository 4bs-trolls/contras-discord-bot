const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Set/Get stats for user')
		.addNumberOption(option =>
			option
				.setName('ifpa')
				.setDescription('Your IFPA ID'))
		.addNumberOption(option =>
			option
				.setName('match-play')
				.setDescription('Your matchplay ID')),
	async execute(interaction) {
		const user = interaction.user;
		const ifpa = interaction.options.getNumber('ifpa');
		const matchPlay = interaction.options.getNumber('match-play');
		await interaction.reply(`${user.username}'s IFPA ID has been updated to ${ifpa} and MatchPlay ID has been updated to ${matchPlay}`);
	},
};