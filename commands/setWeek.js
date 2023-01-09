const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setweek')
		.setDescription('Set the variables for the current weeks match')
		.addStringOption(option =>
			option
				.setName('date')
				.setDescription('Date of the match in {Mmm DD} format. i.e. Jan 23rd')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('venue')
				.setDescription('Venue of the match')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('team')
				.setDescription('3 letter code, as determined by MNP, for the team we are up against this week. i.e. CDC for Contras')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.reply('You have set the new week!');
	},
};