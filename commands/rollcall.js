const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');

const fs = require('fs');
const path = require("path");
const supabase = require( path.join(__dirname, '../supabase-assistant.js') )
const { startAttendanceMessage, getDefaultAttendance} = require("../attendance-assistant");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rollcall')
		.setDescription('Run a rollcall for this week\'s pinball match')
		.setDefaultMemberPermissions('0'),
	async execute(interaction) {
		try {
			let defaultAttendance = await getDefaultAttendance(interaction);

			const result = await supabase.getUpcomingMatch();
			if (result === 'There are no upcoming matches') {
				await interaction.reply({ content: 'There are no upcoming matches to rollcall for', ephemeral: true });
			} else {
				const {week, date, venue, team} = result;
				const { attendanceChannel, annoucementsChannel } = getRollcallChannels(interaction);
				const replyButtons = getReplyButtons();
				const embed = getRollcallEmbed(week, date, venue, team);
				await interaction.reply({ content: 'Rollcall initiated', ephemeral: true });
				const attendanceMessage = await attendanceChannel.send({ content: `Below are attendance records for the match against **${team}** on **${date}**` });
				defaultAttendance = {
					...defaultAttendance,
					date: result.date,
					week: result.week,
					venue: result.venue,
					team: result.team,
					message: attendanceMessage.id,
				}
				await startAttendanceMessage(attendanceMessage, defaultAttendance);
				await annoucementsChannel.send({ content: `@everyone It is that time again! Please use the buttons below to let us know your availability for Week ${week} as soon as you can... \n\n`, embeds: [embed], components: [replyButtons] });
			}
			// fs.writeFileSync(path.join('./', 'data', 'attendanceWeek'+result.week+'.json'), JSON.stringify(defaultAttendance));

		} catch (e) {
			await interaction.editReply({ content: 'Failed to retrieve this week\'s data\n\n ERROR: '+e.stack, ephemeral: true });
		}
	},
};

function getRollcallEmbed(week, date, venue, team) {
	return new EmbedBuilder()
		.setColor('f0791e')
		.setTitle(`Week ${week} - Contras vs ${team}`)
		.setDescription(`Monday Night Pinball, Week ${week} \n ${date} @ 8:15PM at ${venue}`)
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
	const attendanceChannel = interaction.client.channels.cache.get(process.env.ATTENDANCE_CHANNEL_ID);
	const annoucementsChannel = interaction.client.channels.cache.get(process.env.ANNOUNCEMENTS_CHANNEL_ID);
	return { attendanceChannel, annoucementsChannel };
}


