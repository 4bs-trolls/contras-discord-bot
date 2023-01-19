const fs = require('node:fs');
const path = require('node:path');
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
		const userID = interaction.user.id;
		const ifpa = interaction.options.getNumber('ifpa');
		const matchPlay = interaction.options.getNumber('match-play');
		const statsJsonPath = path.join('./', 'data', 'stats.json');

		const rawData = fs.readFileSync(statsJsonPath);
		const data = JSON.parse(rawData);
		let userData;
		if (data[userID]) {
			userData = data[userID];
		} else {
			data[userID] = {};
		}

		let replyMessage;

		if (ifpa || matchPlay) {
			setIDs();
		} else if (userData) {
			replyMessage = getUserStats(userData);
		} else {
			replyMessage = 'It looks like you have not set your IFPA or MatchPlay IDs, here are the team stats: http://pinballstats.info/search/iprsearch.pl?team=CDC';
		}
		await interaction.reply({ content: replyMessage, ephemeral: true });

		function setIDs() {
			if (ifpa && matchPlay) {
				data[userID].ifpa = ifpa;
				data[userID].matchPlay = matchPlay;
				replyMessage = `IFPA ID has been set to ${data[userID].ifpa} and MatchPlay ID has been set to ${data[userID].matchPlay}`;
			} else if (ifpa) {
				data[userID].ifpa = ifpa;
				replyMessage = `IFPA ID has been set to ${data[userID].ifpa}`;
			} else if (matchPlay) {
				data[userID].matchPlay = matchPlay;
				replyMessage = `MatchPlay ID has been set to ${data[userID].matchPlay}`;
			}
			const jsonData = JSON.stringify(data);
			fs.writeFileSync(statsJsonPath, jsonData);
		}

		function getUserStats() {
			replyMessage = '**Your Stats Links:**\n';
			if (userData.ifpa) {
				replyMessage += `IFPA: https://www.ifpapinball.com/player.php?p=${userData.ifpa}\n`;
			}
			if (userData.matchPlay) {
				replyMessage += `MatchPlay: https://next.matchplay.events/users/${userData.matchPlay}\n`;
			}
			replyMessage += 'Team Stats: http://pinballstats.info/search/iprsearch.pl?team=CDC';
			return replyMessage;
		}
	},
};

