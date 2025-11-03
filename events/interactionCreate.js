const { Events, EmbedBuilder, channelMention } = require('discord.js');
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
				// Handle statistics buttons
				if (DiscordUtils.isStatsButton(interaction)) {
					await handleStatsButton(interaction);
					return;
				}

				// TODO: Reject interaction and let the user know if they responded with the same status (double click)
				await interaction.deferReply( { ephemeral: true } );
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
				await interaction.followUp({ content: replyMessage, ephemeral: true });
			}
			catch (error) {
				await interaction.followUp({ content: 'Failed to update attendance\n\n ERROR: ' + error.stack, ephemeral: true });
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

async function handleStatsButton(interaction) {
	const { stripIndent } = require('common-tags');
	await interaction.deferReply({ ephemeral: true });

	const { action, entityId, seasonId } = DiscordUtils.parseStatsButtonId(interaction.customId);

	try {
		if (action === DiscordUtils.STATS_PLAYER_HISTORY_PREFIX) {
			const result = await SupabaseHelper.getPlayerHistory(entityId, seasonId);
			if (!result || !result.games || result.games.length === 0) {
				await interaction.followUp({
					content: `No game history found for this player in season ${seasonId}.`,
					ephemeral: true,
				});
				return;
			}

			const gamesToShow = result.games.slice(0, 15);
			const historyText = gamesToShow
				.map((game) => `Week ${game.week}: ${game.machine} - ${game.score.toLocaleString('en-US')} pts (${game.points} points vs ${game.opponent})`)
				.join('\n');

			const message = stripIndent(`
				**Player History - ${result.playerName}**
				Season: ${result.seasonId}
				Total Games: ${result.games.length}
				Showing: ${gamesToShow.length} most recent games

				${historyText}
			`);

			await interaction.followUp({ content: message, ephemeral: true });

		} else if (action === DiscordUtils.STATS_MACHINE_AVG_PREFIX) {
			const result = await SupabaseHelper.getAverageScoreForMachine(entityId, seasonId);
			if (!result) {
				await interaction.followUp({
					content: `No data found for this machine in season ${seasonId}.`,
					ephemeral: true,
				});
				return;
			}

			const message = stripIndent(`
				**Machine Average Statistics**
				Machine: ${result.machine}
				Average Score: ${result.averageScore.toLocaleString('en-US')}
				Games Played: ${result.gamesPlayed}
				Season: ${result.seasonId}
			`);

			await interaction.followUp({ content: message, ephemeral: true });

		} else if (action === DiscordUtils.STATS_MACHINE_LEADERBOARD_PREFIX) {
			const result = await SupabaseHelper.getMachineLeaderboard(entityId, seasonId, 10);
			if (!result || !result.scores || result.scores.length === 0) {
				await interaction.followUp({
					content: `No scores found for this machine in season ${seasonId}.`,
					ephemeral: true,
				});
				return;
			}

			const scoresText = result.scores
				.map((score, index) => `${index + 1}. ${score.playerName}: ${score.score.toLocaleString('en-US')} (Week ${score.week})`)
				.join('\n');

			const message = stripIndent(`
				**Machine Leaderboard - ${result.machine}**
				Season: ${result.seasonId}
				Top ${result.scores.length} Scores

				${scoresText}
			`);

			await interaction.followUp({ content: message, ephemeral: true });

		} else if (action === DiscordUtils.STATS_TEAM_PERFORMANCE_PREFIX) {
			const result = await SupabaseHelper.getTeamPerformance(entityId, seasonId);
			if (!result) {
				await interaction.followUp({
					content: `No performance data found for this team in season ${seasonId}.`,
					ephemeral: true,
				});
				return;
			}

			const message = stripIndent(`
				**Team Performance - Season ${result.seasonId}**
				Team ID: ${result.teamId}
				Matches Played: ${result.matchesPlayed}
				Total Points: ${result.totalPoints}
				Average Points Per Match: ${result.averagePointsPerMatch}
			`);

			await interaction.followUp({ content: message, ephemeral: true });

		} else if (action === DiscordUtils.STATS_TOP_PICKS_PREFIX) {
			const result = await SupabaseHelper.getTopPickedMachines(entityId, seasonId);
			if (!result || !result.machines || result.machines.length === 0) {
				await interaction.followUp({
					content: `No machine selection data found for this team in season ${seasonId}.`,
					ephemeral: true,
				});
				return;
			}

			const machinesToShow = result.machines.slice(0, 10);
			const machinesText = machinesToShow
				.map((machine, index) => `${index + 1}. ${machine.machineName}: ${machine.pickCount} times`)
				.join('\n');

			const message = stripIndent(`
				**Top Machine Picks**
				Team: ${result.teamId}
				Season: ${result.seasonId}
				Showing top ${machinesToShow.length} machines

				${machinesText}
			`);

			await interaction.followUp({ content: message, ephemeral: true });
		}

	} catch (error) {
		console.error('Error handling stats button:', error);
		await interaction.followUp({
			content: 'Failed to retrieve statistics: ' + error.message,
			ephemeral: true,
		});
	}
}

