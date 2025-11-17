const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('restart')
		.setDescription('Restart the bot')
		.setDefaultMemberPermissions('0'),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		await interaction.editReply({ content: 'Restarting...', ephemeral: true });
		process.exit();
	},
};