const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rollcall')
		.setDescription('Run a rollcall for this week\'s pinball match')
		.setDefaultMemberPermissions('0'),
	async execute(interaction) {
		await interaction.reply('rollcall!');
	},
};