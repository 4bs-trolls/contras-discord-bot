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

module.exports = {
	sendMessageToChannel,
	isUserCaptain,
	isUserMember,
	isUserSub,
	isSubReaction,
	isRollcallReaction,
	SUBS_ACCEPT_BUTTON,
	ROLLCALL_DECLINE_BUTTON,
	ROLLCALL_ACCEPT_BUTTON,
};