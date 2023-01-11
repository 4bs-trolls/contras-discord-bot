const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('subs')
		.setDescription('Run a sub rollcall for this week\'s pinball match')
		.setDefaultMemberPermissions('0'),
	async execute(interaction) {
		const subsChannel = interaction.client.channels.cache.get('1059182204237918248');
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
					.setCustomId('subs-accept')
					.setLabel('Blast some balls!')
					.setEmoji('1059189786910408714')
					.setStyle(ButtonStyle.Success),
			);
		await interaction.reply({ content: `Subs requested for match against **${team}** at **${venue}** on **${date}**`, ephemeral: true });
		await subsChannel.send({ content: `@here Someone is out this week on the normal roster so we could use your help! This week's match is at **${venue}** against **${team}** \n\nIf you would like to sub for the :contras: ontras this week, let us know by tapping the button below!`, components: [replyButtons] });
	},
};