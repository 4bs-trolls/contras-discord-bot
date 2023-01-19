const { SlashCommandBuilder } = require('discord.js');
const { captain } = require('../roles.json');
const { stripIndent } = require('common-tags');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Breakdown of each command available'),
	async execute(interaction) {
		const roles = getUserRoles(interaction);
		const helpMessage = getHelpMessage(roles);
		await interaction.reply({ content: helpMessage, ephemeral: true });
	},
};

function getHelpMessage(roles) {
	let message;
	const isCaptain = captain.some(x => roles.some(y => y === x));
	message = stripIndent(`
		\`/next-match\` will retrieve the Date, Venue, and Team for the upcoming match
		\`/links\` returns a set of helpful links
		\`/stats\` returns your IFPA/MatchPlay links if set; always includes the team stats link
				**Optional Params [\`ifpa\`, \`match-play\`]:** sets the IFPA/MatchPlay ID(s) for your Discord user
		\`/server\` returns the name of the server and how many users it has
		\`/user\` returns the Username of the user who ran the command, and the date/time
	`);
	if (isCaptain) {
		message += '\n\n';
		message += stripIndent(`
			**Captain Only Commands**
			\`/set-week\` is used to set the upcoming match's Date, Venue, and Team\n
			\`/rollcall\` will send an everyone ping in the annoucements channel that will ask for attendance with buttons for yes/no. As users reply, the embed in the original message will update with whether users are in or if they need a sub, and messages will be sent to the attendance channel\n
			\`/restart\` will kill the service. As long as the bot is run using PM2, the bot will restart automatically making this an easy command to restart the bot\n
			\`/subs\` will send an everyone ping in the subs channel that will ask for subs. As users reply, the attendance channel will be notified of each person wanting to sub\n
		`);
	}

	return message;
}

function getUserRoles(interaction) {
	return interaction.member['_roles'];
}