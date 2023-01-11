const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rollcall')
		.setDescription('Run a rollcall for this week\'s pinball match')
		.setDefaultMemberPermissions('0'),
	async execute(interaction) {
		const attendanceChannel = interaction.client.channels.cache.get('1055572161185730652');
		const annoucementsChannel = interaction.client.channels.cache.get('1055571992658587658');
		const variablesJson = path.join('./', 'data', 'next-match.json');

		let date;
		let venue;
		let team;

		try {
			const data = fs.readFileSync(variablesJson);
			const thisWeek = JSON.parse(data);

			date = thisWeek.date;
			venue = thisWeek.venue;
			team = thisWeek.team;
		} catch (e) {
			console.error(e);
		}
		const replyButtons = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('rollcall-accept')
					.setLabel('Blast some balls!')
					.setEmoji('1059189786910408714')
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId('rollcall-decline')
					.setLabel('Find me a sub')
					.setStyle(ButtonStyle.Danger),
			);
		const results = new EmbedBuilder()
			.setColor('f0791e')
			.setTitle(`Contras vs ${team}`)
			.setDescription(`Monday Night Pinball, Week 1 \n ${date} at ${venue}`)
			.setAuthor({ name: 'Coindexter Contras', iconURL: 'https://i.imgur.com/wS0ZY6f.png' })
			.setURL('https://www.mondaynightpinball.com/teams/CDC')
			.setFooter({ text: 'This bot is brought to you by LuckBasedGaming', iconURL: 'https://i.imgur.com/f3E6fEN.png' })
			.setThumbnail('https://i.imgur.com/V9kalvC.png');
		await interaction.reply({ content: 'Rollcall initiated', ephemeral: true });
		await attendanceChannel.send({ content: `----------------**ATTENDANCE**----------------\nBelow are attendance records for the against **${team}** on **${date}**\n -----------------------------------------------` });
		await annoucementsChannel.send({ content: '@everyone It is that time again! Please use the buttons below to let us know your availability as soon as you can... \n\n**_Please_ only select 1 option**\n\n', embeds: [results], components: [replyButtons] });
	},
};