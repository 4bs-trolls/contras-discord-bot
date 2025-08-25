const { EmbedBuilder } = require('discord.js');
const { map } = require('lodash');

const SupabaseHelper = require('./SupabaseHelper');
const DiscordUtils = require('./DiscordUtils');
const { TEAM_NAME, TEAM_WITH_VENUE } = require('../constants');

const AttendanceStatus = {
	NOT_RESPONDED: 'Not Responded',
	UNKNOWN: 'Unknown',
	ACCEPTED: 'Accepted',
	DECLINED: 'Declined',
	INTERESTED: 'Interested',
};

function turnAttendanceIntoRollcallEmbed(attendanceData) {
	const embed = new EmbedBuilder()
		.setColor('f0791e')
		.setTitle(`Week ${attendanceData.week} - ${TEAM_NAME} vs ${attendanceData.team}`)
		.setDescription(`Monday Night Pinball, Week ${attendanceData.week} \n ${attendanceData.date} @ 8:15PM at ${attendanceData.venue}`)
		.setAuthor({ name: TEAM_WITH_VENUE, iconURL: 'https://i.imgur.com/nJ9OXOV.png' })
		.setURL('https://www.mondaynightpinball.com/teams/CDC')
		.setFooter({
			text: 'This bot is brought to you by LuckBasedGaming',
			iconURL: 'https://i.imgur.com/f3E6fEN.png',
		})
		.setThumbnail('https://i.imgur.com/5QDFDSr.png');

	const players = attendanceData.players;
	for (const player of players) {
		if (player.status !== AttendanceStatus.UNKNOWN) {
			embed.addFields({ name: player.name, value: getRollcallStatus(player.status) });
		}
	}
	return embed;
}

function turnAttendanceIntoEmbed(attendanceData) {
	const embed = new EmbedBuilder()
		.setColor('f0791e')
		.setTitle(`Attendance for Week ${attendanceData.week}`)
		.setDescription(`Monday Night Pinball, Week ${attendanceData.week} \n ${attendanceData.date} @ 8:15PM at ${attendanceData.venue}`);

	const players = attendanceData.players;
	for (const player of players) {
		if (player.status !== AttendanceStatus.UNKNOWN) {
			embed.addFields({ name: player.name, value: player.status, inline: true });
		}
	}
	return embed;
}


function normalizeAttendanceData(players, week, date, venue, team) {
	return {
		players: players,
		week: week,
		date: date,
		venue: venue,
		team: team,
	};

}
async function updateStatusForPlayer(player, week, season, status) {
	const oldAttendanceData = await SupabaseHelper.getAttendanceForPlayer(player.id, week, season);
	const attendanceData = { player_id: player.id, name: player.nickname, week, season, status };
	await SupabaseHelper.updateAttendance([attendanceData]);
	return { oldAttendanceData, attendanceData };
}

async function setupAttendanceForWeek(week, season, interaction) {
	const guild = interaction.client.guilds.cache.get(process.env.GUILD_ID);
	const discordUsers = await guild.members.fetch();
	const allTrolls = [];
	discordUsers.forEach(player => {
		allTrolls.push({
			player_id: player.id,
			name: getPlayerName(player),
			status: getPlayerStartingStatus(player),
			week: week,
			season: season,
			role_ids: getRoleIds(player),
		});
	});
	await SupabaseHelper.updateAttendance(allTrolls);
	return {
		players: map(allTrolls, function(contra) {
				return {
					id: contra.player_id,
					name: contra.name,
					status: contra.status,
				};
			},
		),
	};
}

function getPlayerName(player) {
	let name = player.nickname === null ? player.user.username : player.nickname;
	if (DiscordUtils.isUserSub(player)) {
		name = name + ' [SUB]';
	}
	return name;
}

function getPlayerStartingStatus(player) {
	if (DiscordUtils.isUserMember(player) || DiscordUtils.isUserCaptain(player)) {
		return AttendanceStatus.NOT_RESPONDED;
	} else {
		return AttendanceStatus.UNKNOWN;
	}
}

function getRollcallStatus(status) {
	switch (status) {
		case AttendanceStatus.ACCEPTED:
			return ' is ready to defend the castle!';
		case AttendanceStatus.DECLINED:
			return ' needs a sub';
		case AttendanceStatus.INTERESTED:
			return ' is interested in playing';
		case AttendanceStatus.NOT_RESPONDED:
			return ' has not responded';
		default:
			return ' - Unknown Status';
	}
}

function getRoleIds(player) {
	const roles = player.roles.cache;
	return roles.map(role => role.id);
}


module.exports = {
	turnAttendanceIntoEmbed,
	turnAttendanceIntoRollcallEmbed,
	setupAttendanceForWeek,
	updateStatusForPlayer,
	normalizeAttendanceData,
	AttendanceStatus,
};