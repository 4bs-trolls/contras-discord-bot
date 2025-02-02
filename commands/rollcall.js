const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const AttendanceHelper = require('../helpers/AttendanceHelper');
const DiscordUtils = require('../helpers/DiscordUtils');
const { ROLLCALL_DECLINE_BUTTON, ROLLCALL_ACCEPT_BUTTON } = require('../helpers/DiscordUtils');
const season = process.env.SEASON;
const attendanceChannelId = process.env.ATTENDANCE_CHANNEL_ID;
const announcementsChannelId = process.env.ANNOUNCEMENTS_CHANNEL_ID;

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
				const attendanceData = await AttendanceHelper.setupAttendanceForWeek(week, season, interaction);
				const acceptButton = new ButtonBuilder()
					.setCustomId(ROLLCALL_ACCEPT_BUTTON)
					.setLabel('Blast some balls!')
					.setEmoji('1059189786910408714') // Contras emoji
					.setStyle(ButtonStyle.Success);
				const declineButton = new ButtonBuilder()
					.setCustomId(ROLLCALL_DECLINE_BUTTON)
					.setLabel('Find me a sub')
					.setStyle(ButtonStyle.Danger);
				const replyButtons = new ActionRowBuilder()
					.addComponents(acceptButton, declineButton);
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
				const announcementContent = `@everyone It is that time again! Please use the buttons below to let us know your availability for Week ${week} as soon as you can... \n\n`;
				const announcementMessage = await DiscordUtils.sendMessageToChannel(interaction, announcementsChannelId, announcementContent, [embed], [replyButtons]);
				const attendanceMessage = await DiscordUtils.sendMessageToChannel(interaction, attendanceChannelId, `Below are attendance records for the match against **${team}** on **${date}**`);
				let normalizedAttendanceData = AttendanceHelper.normalizeAttendanceData(attendanceData.players, week, date, venue, team);
				normalizedAttendanceData = {
					...normalizedAttendanceData,
					attendance_message_id: attendanceMessage.id,
					announcement_message_id: announcementMessage.id,
				};
				const attendanceEmbed = AttendanceHelper.turnAttendanceIntoEmbed(normalizedAttendanceData);
				await attendanceMessage.edit({
					content: `Below are attendance records for Week ${(normalizedAttendanceData.week)} against **${(normalizedAttendanceData.team)}** on **${(normalizedAttendanceData.date)}**`,
					embeds: [attendanceEmbed],
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


