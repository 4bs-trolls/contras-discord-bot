const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Set/Get stats for user'),
	async execute(interaction) {
		await interaction.reply('hello world');
	},
};