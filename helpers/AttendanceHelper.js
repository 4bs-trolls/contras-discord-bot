const { EmbedBuilder } = require('discord.js');
const { map } = require('lodash');

const SupabaseHelper = require('./SupabaseHelper');
const DiscordUtils = require('./DiscordUtils');

const AttendanceStatus = {
	NOT_RESPONDED: 'Not Responded',
	UNKNOWN: 'Unknown',
	ACCEPTED: 'Accepted',
	DECLINED: 'Declined',
	INTERESTED: 'Interested',
};

function turnAttendanceIntoEmbed(attendanceData) {
	const players = attendanceData.players;

	let embed = new EmbedBuilder()
		.setColor('f0791e')
		.setTitle(`Attendance for Week ${attendanceData.week}`)
		.setDescription(`Monday Night Pinball, Week ${attendanceData.week} \n ${attendanceData.date} @ 8:15PM at ${attendanceData.venue}`);

	let newEmbed = EmbedBuilder.from(embed);
	for (const player of players) {
		if (player.status !== AttendanceStatus.UNKNOWN) {
			newEmbed.addFields({ name: player.name, value: player.status, inline: true });
		}
	}
	return newEmbed;
}

async function updateStatusForPlayer(player_id, week, season, status) {
	const oldAttendanceData = await SupabaseHelper.getAttendanceForPlayer(player_id, week, season);
	const attendanceData = { player_id, week, season, status };
	await SupabaseHelper.updateAttendance(attendanceData);
	return { old: oldAttendanceData, new: attendanceData };
}

async function setupAttendanceForWeek(week, season, interaction) {
	const guild = interaction.client.guilds.cache.get(process.env.GUILD_ID);
	const discordUsers = await guild.members.fetch();
	const allContras = [];
	discordUsers.forEach(player => {
		allContras.push({
			player_id: player.id,
			name: getPlayerName(player),
			status: getPlayerStartingStatus(player),
			week: week,
			season: season,
			role_ids: getRoleIds(player),
			role: getContraRole(player),
		});
	});
	await SupabaseHelper.updateAttendance(allContras);
	return {
		players: map(allContras, function(contra) {
				return {
					id: contra.id,
					name: contra.name,
					status: contra.status,
					role: contra.role,
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

function getRoleIds(player) {
	const roles = player.roles.cache;
	return roles.map(role => role.id);
}

function getContraRole(player) {
	if (DiscordUtils.isUserCaptain(player) || DiscordUtils.isUserMember(player)) {
		return 'Weekly Player';
	} else if (DiscordUtils.isUserSub(player)) {
		return 'Sub';
	}
}


module.exports = {
	turnAttendanceIntoEmbed,
	setupAttendanceForWeek,
	updateStatusForPlayer,
	AttendanceStatus,
};