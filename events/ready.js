const { Events, ActivityType } = require('discord.js');
const logger = require('../helpers/Logger');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		logger.info(`Bot ready! Logged in as ${client.user.tag}`, {
			userId: client.user.id,
			username: client.user.username,
			guildCount: client.guilds.cache.size
		});
		client.user.setPresence({ activities: [{ name: 'Monday Night Pinball', type: ActivityType.Competing }], status: 'online' });
	},
};