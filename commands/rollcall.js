const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const AttendanceHelper = require('../helpers/AttendanceHelper');
const season = process.env.SEASON;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rollcall')
		.setDescription('Run a rollcall for this week\'s pinball match')
		.setDefaultMemberPermissions('0'),
	async execute(interaction) {
		try {
			const result = await SupabaseHelper.getUpcomingMatch();
			if (result === 'There are no upcoming matches') {
				await interaction.reply({ content: 'There are no upcoming matches to rollcall for', ephemeral: true });
			} else {
				const { week, date, venue, team } = result;
				let defaultAttendance = await AttendanceHelper.setupAttendanceForWeek(week, season, interaction);
				const attendanceChannel = interaction.client.channels.cache.get(process.env.ATTENDANCE_CHANNEL_ID);
				const announcementsChannel = interaction.client.channels.cache.get(process.env.ANNOUNCEMENTS_CHANNEL_ID);
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
				const embed = new EmbedBuilder()
					.setColor('f0791e')
					.setTitle(`Week ${week} - Contras vs ${team}`)
					.setDescription(`Monday Night Pinball, Week ${week} \n ${date} @ 8:15PM at ${venue}`)
					.setAuthor({ name: 'Coindexter Contras', iconURL: 'https://i.imgur.com/wS0ZY6f.png' })
					.setURL('https://www.mondaynightpinball.com/teams/CDC')
					.setFooter({
						text: 'This bot is brought to you by LuckBasedGaming',
						iconURL: 'https://i.imgur.com/f3E6fEN.png',
					})
					.setThumbnail('https://i.imgur.com/V9kalvC.png');
				await interaction.reply({ content: 'Rollcall initiated', ephemeral: true });
				const attendanceMessage = await attendanceChannel.send({ content: `Below are attendance records for the match against **${team}** on **${date}**` });
				defaultAttendance = {
					...defaultAttendance,
					date: result.date,
					week: result.week,
					venue: result.venue,
					team: result.team,
					message: attendanceMessage.id,
				};
				await AttendanceHelper.startAttendanceMessage(attendanceMessage, defaultAttendance);
				await announcementsChannel.send({
					content: `@everyone It is that time again! Please use the buttons below to let us know your availability for Week ${week} as soon as you can... \n\n`,
					embeds: [embed],
					components: [replyButtons],
				});
			}

		} catch (e) {
			await interaction.editReply({
				content: 'Failed to retrieve this week\'s data\n\n ERROR: ' + e.stack,
				ephemeral: true,
			});
		}
	},
};


