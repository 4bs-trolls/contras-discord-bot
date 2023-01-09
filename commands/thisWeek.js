const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('this-week')
		.setDescription('View this week\'s match details'),
	async execute(interaction) {
		let message = '';
		const variablesJson = path.join('./', 'data', 'variables.json');
		try {
			const data = fs.readFileSync(variablesJson);
			const variables = JSON.parse(data);

			const date = variables.thisWeek.date;
			const venue = variables.thisWeek.venue;
			const team = variables.thisWeek.team;

			message = 'This week\'s match is:\n\n`Date:` *' + date + '* \n`Venue:` *' + venue + '* \n`Team:` *' + team + '*';
		} catch (e) {
			message = 'Failed to retrieve this week\'s data';
		}

		await interaction.reply(message);
	},
};