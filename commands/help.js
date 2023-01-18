const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Breakdown of each command available'),
	async execute(interaction) {
		await interaction.reply('reply goes here');
	},
};
