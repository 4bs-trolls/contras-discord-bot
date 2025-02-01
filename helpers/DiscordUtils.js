async function sendMessageToChannel(interaction, channelId, content, embeds, components) {
	try {
	const channel = interaction.client.channels.cache.get(channelId);
	if (!channel) {
		console.error(`Channel with id ${channelId} not found`);
		return;
	}
		return await channel.send({ content, embeds, components });
	} catch (e) {
		console.error(e);
		return Promise.reject(e.message)
	}
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
};