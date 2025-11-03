const ROLLCALL_ACCEPT_BUTTON = 'rollcall-accept';
const ROLLCALL_DECLINE_BUTTON = 'rollcall-decline';
const SUBS_ACCEPT_BUTTON = 'subs-accept';

async function sendMessageToChannel(interaction, channelId, content, embeds, components) {
	const channel = interaction.client.channels.cache.get(channelId);
	if (!channel) {
		console.error(`Channel with id ${channelId} not found`);
		return;
	}
	return await channel.send({ content, embeds, components });
}

function isRollcallReaction(interaction) {
	return interaction.customId === ROLLCALL_ACCEPT_BUTTON || interaction.customId === ROLLCALL_DECLINE_BUTTON;
}

function isSubReaction(interaction) {
	return interaction.customId === SUBS_ACCEPT_BUTTON;
}

function isUserCaptain(user) {
	return isUserPartOfRole(user, process.env.CAPTAIN_ROLE_ID);
}

function isUserMember(user) {
	return isUserPartOfRole(user, process.env.MEMBER_ROLE_ID);
}

function isUserSub(user) {
	return isUserPartOfRole(user, process.env.SUB_ROLE_ID);
}

function isUserPartOfRole(user, roleId) {
	return user.roles.cache.some(role => role.id === roleId);
}

// Statistics button prefixes
const STATS_PLAYER_HISTORY_PREFIX = 'stats-player-history';
const STATS_PLAYER_AVG_PREFIX = 'stats-player-avg';
const STATS_MACHINE_AVG_PREFIX = 'stats-machine-avg';
const STATS_MACHINE_LEADERBOARD_PREFIX = 'stats-machine-leaderboard';
const STATS_TEAM_PERFORMANCE_PREFIX = 'stats-team-performance';
const STATS_TOP_PICKS_PREFIX = 'stats-top-picks';

function isStatsButton(interaction) {
	const customId = interaction.customId;
	return customId.startsWith('stats-');
}

function createStatsButtonId(prefix, entityId, seasonId) {
	return `${prefix}:${entityId}:${seasonId}`;
}

function parseStatsButtonId(customId) {
	const parts = customId.split(':');
	return {
		action: parts[0],
		entityId: parts[1],
		seasonId: parts[2],
	};
}

module.exports = {
	sendMessageToChannel,
	isUserCaptain,
	isUserMember,
	isUserSub,
	isSubReaction,
	isRollcallReaction,
	isStatsButton,
	createStatsButtonId,
	parseStatsButtonId,
	SUBS_ACCEPT_BUTTON,
	ROLLCALL_DECLINE_BUTTON,
	ROLLCALL_ACCEPT_BUTTON,
	STATS_PLAYER_HISTORY_PREFIX,
	STATS_PLAYER_AVG_PREFIX,
	STATS_MACHINE_AVG_PREFIX,
	STATS_MACHINE_LEADERBOARD_PREFIX,
	STATS_TEAM_PERFORMANCE_PREFIX,
	STATS_TOP_PICKS_PREFIX,
};