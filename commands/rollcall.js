const { prod, dev } = require('./../channels.json');
const { team, venue, date } = require('./../data/next-match.json');
const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rollcall')
		.setDescription('Run a rollcall for this week\'s pinball match')
		.setDefaultMemberPermissions('0'),
	async execute(interaction) {
		const { attendanceChannel, annoucementsChannel } = getRollcallChannels(interaction);
		const replyButtons = getReplyButtons();
		const embed = getRollcallEmbed();
		await interaction.reply({ content: 'Rollcall initiated', ephemeral: true });
		await attendanceChannel.send({ content: `----------------**ATTENDANCE**----------------\nBelow are attendance records for the match against **${team}** on **${date}**\n -----------------------------------------------` });
		await annoucementsChannel.send({ content: '@everyone It is that time again! Please use the buttons below to let us know your availability as soon as you can... \n\n**_Please_ only select 1 option**\n\n', embeds: [embed], components: [replyButtons] });
	},
};

function getRollcallEmbed() {
	return new EmbedBuilder()
		.setColor('f0791e')
		.setTitle(`Contras vs ${team}`)
		// TODO: Turn '3' into a variable that is set in set-week.js
		.setDescription(`Monday Night Pinball, Week 3 \n ${date} at ${venue}`)
		.setAuthor({ name: 'Coindexter Contras', iconURL: 'https://i.imgur.com/wS0ZY6f.png' })
		.setURL('https://www.mondaynightpinball.com/teams/CDC')
		.setFooter({ text: 'This bot is brought to you by LuckBasedGaming', iconURL: 'https://i.imgur.com/f3E6fEN.png' })
		.setThumbnail('https://i.imgur.com/V9kalvC.png');
}

function getReplyButtons() {
	return new ActionRowBuilder()
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
}

function getRollcallChannels(interaction) {
	let annoucementsChannel;
	let attendanceChannel;
	if (interaction.guildId === dev.id) {
		annoucementsChannel = interaction.client.channels.cache.get(dev.annoucements);
		attendanceChannel = interaction.client.channels.cache.get(dev.attendance);
	} else {
		annoucementsChannel = interaction.client.channels.cache.get(prod.annoucements);
		attendanceChannel = interaction.client.channels.cache.get(prod.attendance);
	}
	return { attendanceChannel, annoucementsChannel };
}
