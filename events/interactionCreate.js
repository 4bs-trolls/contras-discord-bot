const { Events, EmbedBuilder, MessageFlags, channelMention } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper');
const { AttendanceStatus } = require('../helpers/AttendanceHelper');
const AttendanceHelper = require('../helpers/AttendanceHelper');
const DiscordUtils = require('../helpers/DiscordUtils');
const { ROLLCALL_ACCEPT_BUTTON, ROLLCALL_DECLINE_BUTTON, SUBS_ACCEPT_BUTTON } = require('../helpers/DiscordUtils');
const season = process.env.SEASON;
const subsChannelId = process.env.SUBS_CHANNEL_ID;
const attendanceChannelId = process.env.ATTENDANCE_CHANNEL_ID;

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {


		// If the user has not set a nickname, reject the interaction
		if (!interaction.member.nickname) {
			await rejectNoNickname(interaction);
		} else if (interaction.isChatInputCommand()) {
			try {
				const command = interaction.client.commands.get(interaction.commandName);
				// If the command does not exist, log an error and return
				if (!command) {
					console.error(`No command matching ${interaction.commandName} was found.`);
					return;
				}
				await command.execute(interaction);
			} catch (error) {
				await interaction.editReply({
					content: 'Failed to retrieve this week\'s data\n\n ERROR: ' + error.stack,
					ephemeral: true,
				});
			}
		} else if (interaction.isButton()) {
			try {
				// TODO: Reject interaction and let the user know if they responded with the same status (double click)
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });
				let attendanceMessage = '';
				let replyMessage = '';

				const user = interaction.member
				const { week, date, venue, team } = await SupabaseHelper.getUpcomingMatch();
				if (interaction.customId === ROLLCALL_ACCEPT_BUTTON) {
					await AttendanceHelper.updateStatusForPlayer(user, week, season, AttendanceStatus.ACCEPTED);
					attendanceMessage = `**${interaction.member.nickname}** is ready to blast some balls!`;

					replyMessage = 'You are in!';
				} else if (interaction.customId === ROLLCALL_DECLINE_BUTTON) {
					await AttendanceHelper.updateStatusForPlayer(user, week, season, AttendanceStatus.DECLINED);
					attendanceMessage = `**${interaction.member.nickname}** is unable to make it this week. You might want to run \`/subs\` in ${channelMention(subsChannelId)}`;

					replyMessage = 'We will find you a sub :smile:';
				} else if (interaction.customId === SUBS_ACCEPT_BUTTON) {
					await AttendanceHelper.updateStatusForPlayer(user, week, season, AttendanceStatus.INTERESTED);
					attendanceMessage = `**${interaction.member.nickname}** wants to sub! We should let them know if we are already full`;

					replyMessage = 'Thanks for volunteering! We appreciate it :smile:. A captain will reach out to you if we still have spots available';
				}
				const attendance = await SupabaseHelper.getAttendance(week, season);
				const normalizeAttendanceData = AttendanceHelper.normalizeAttendanceData(attendance, week, date, venue, team);
				const attendanceEmbed = AttendanceHelper.turnAttendanceIntoEmbed(normalizeAttendanceData);
				const rollcallEmbed = AttendanceHelper.turnAttendanceIntoRollcallEmbed(normalizeAttendanceData);

				if (DiscordUtils.isRollcallReaction(interaction)) {
					await interaction.message.edit({ embeds: [rollcallEmbed] });
				}

				if (attendanceMessage && attendanceEmbed) {
					await DiscordUtils.sendMessageToChannel(interaction, attendanceChannelId, attendanceMessage, [attendanceEmbed]);
				}
				await interaction.editReply({ content: replyMessage, ephemeral: true });
			}
			catch (error) {
				await interaction.editReply({ content: 'Failed to update attendance\n\n ERROR: ' + error.stack, ephemeral: true });
			}

		} else if (interaction.isAutocomplete()) {
			try {
				const command = interaction.client.commands.get(interaction.commandName);
				await command.autocomplete(interaction);
			} catch (error) {
				console.error(error);
			}
		}
	},
};

async function rejectNoNickname(interaction) {
	const embed = new EmbedBuilder()
		.setTitle('Uh oh! It looks like you have not set your nickname yet')
		.setDescription('Please set a nickname so we can identify you in the server by typing `/nick {your name here}`.\n\n**Examples:**\nJohn would type `/nick John`\nNick would type `/nick Nick`')
		.setColor('#FF0000')
		.setTimestamp();
	await interaction.reply({ embeds: [embed], ephemeral: true });
}

