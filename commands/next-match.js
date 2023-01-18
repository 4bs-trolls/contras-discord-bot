const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('next-match')
		.setDescription('View the upcoming match details'),
	async execute(interaction) {
		let message = '';
		const variablesJson = path.join('./', 'data', 'next-match.json');
		try {
			const data = fs.readFileSync(variablesJson);
			const thisWeek = JSON.parse(data);

			const date = thisWeek.date;
			const venue = thisWeek.venue;
			const team = thisWeek.team;

			message = 'The upcoming match is:\n\n`Date:` *' + date + '* \n`Venue:` *' + venue + '* \n`Team:` *' + team + '*';
		} catch (e) {
			message = 'Failed to retrieve this week\'s data';
		}

		await interaction.reply(message);
	},
};