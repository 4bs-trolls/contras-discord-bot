const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const AttendanceHelper = require('../helpers/AttendanceHelper');
const DiscordUtils = require('../helpers/DiscordUtils');
const { ROLLCALL_DECLINE_BUTTON, ROLLCALL_ACCEPT_BUTTON } = require('../helpers/DiscordUtils');
const { TROLL_EMOJI_ID } = require('../constants');
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
			await interaction.deferReply({ ephemeral: true });
			const result = await SupabaseHelper.getUpcomingMatch();
			if (result === 'There are no upcoming matches') {
				await interaction.editReply({ content: 'There are no upcoming matches to rollcall for', ephemeral: true });
			} else {
				const acceptButton = new ButtonBuilder()
					.setCustomId(ROLLCALL_ACCEPT_BUTTON)
					.setLabel('TROLLS! UP')
					.setEmoji(TROLL_EMOJI_ID)
					.setStyle(ButtonStyle.Danger);
				const declineButton = new ButtonBuilder()
					.setCustomId(ROLLCALL_DECLINE_BUTTON)
					.setLabel('Find me a sub')
					.setStyle(ButtonStyle.Secondary);
				const replyButtons = new ActionRowBuilder().addComponents(acceptButton, declineButton);
				const { week, date, venue, team } = result;
				const attendanceData = await AttendanceHelper.setupAttendanceForWeek(week, season, interaction);
				const normalizedAttendanceData = AttendanceHelper.normalizeAttendanceData(attendanceData.players, week, date, venue, team);
				const embed = AttendanceHelper.turnAttendanceIntoRollcallEmbed(normalizedAttendanceData);
				const attendanceEmbed = AttendanceHelper.turnAttendanceIntoEmbed(normalizedAttendanceData);
				await interaction.editReply({ content: 'Rollcall initiated', ephemeral: true });

				const announcementContent = `@everyone It is that time again! Please use the buttons below to let us know your availability for Week ${week} as soon as you can... \n\n`;
				await DiscordUtils.sendMessageToChannel(interaction, announcementsChannelId, announcementContent, [embed], [replyButtons]);

				const attendanceContent = `Below are attendance records for Week ${(normalizedAttendanceData.week)} against **${(normalizedAttendanceData.team)}** on **${(normalizedAttendanceData.date)}**`;
				await DiscordUtils.sendMessageToChannel(interaction, attendanceChannelId, attendanceContent, [attendanceEmbed]);

			}

		} catch (e) {
			await interaction.editReply({
				content: 'Failed to retrieve this week\'s data\n\n ERROR: ' + e.stack,
				ephemeral: true,
			});
		}
	},
};

