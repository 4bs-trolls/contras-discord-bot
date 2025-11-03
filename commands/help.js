const { SlashCommandBuilder } = require('discord.js');
const captain = process.env.CAPTAIN_ROLE_ID;
const { stripIndent } = require('common-tags');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Breakdown of each command available'),
	async execute(interaction) {
		const roles = getUserRoles(interaction);
		const isCaptain = roles.some(x => x === captain);

		// Message 1: General Commands
		const generalMessage = stripIndent(`
			**General Commands**
			\`/next-match\` will retrieve the Date, Venue, and Team for the upcoming match
			\`/links\` returns a set of helpful links
			\`/stats\` returns your IFPA/MatchPlay links if set; always includes the team stats link
					**Optional Params [\`ifpa\`, \`match-play\`]:** sets the IFPA/MatchPlay ID(s) for your Discord user
			\`/server\` returns the name of the server and how many users it has
			\`/user\` returns the Username of the user who ran the command, and the date/time they joined the server
			\`/help\` returns this help message
		`);

		// Message 2: Search Commands
		const searchMessage = stripIndent(`
			**Search Commands** (Easy way to find IDs!)
			\`/search-player <player_name> [season]\` - Search for a player and get quick stats
			\`/search-machine <machine_name> [season]\` - Search for a machine and view statistics
			\`/search-team <team_name> [season]\` - Search for a team and view info
		`);

		// Message 3: Statistics Commands
		const statsMessage = stripIndent(`
			**Statistics Commands** (Use search commands to find IDs!)
			\`/avg-game <machine-id> [season]\` - Get average score for a pinball machine
			\`/player-machine-avg <player-id> <machine-id> [season]\` - Get a player's average on a specific machine
			\`/machine-leaderboard <machine-id> [season] [limit]\` - View top scores on a specific machine
			\`/player-history <player-id> [season] [limit]\` - View a player's complete game history
			\`/team-performance <team-id> [season]\` - View team performance statistics
			\`/recent-scores <machine-id> [limit]\` - View the most recent scores on a specific machine
			\`/top-picks <team-id> [season] [limit]\` - View machines an opposing team picks most frequently

			**Tips:**
			• Use season \`0\` for all-time statistics (e.g., \`/avg-game mm 0\`)
			• Commands needing IDs will guide you to use search commands
		`);

		// Send messages
		await interaction.reply({ content: generalMessage, ephemeral: true });
		await interaction.followUp({ content: searchMessage, ephemeral: true });
		await interaction.followUp({ content: statsMessage, ephemeral: true });

		// Message 4: Captain Commands (if applicable)
		if (isCaptain) {
			const captainMessage = stripIndent(`
				**Captain Only Commands**
				\`/set-week\` has been deprecated -- automatically updates via database 
				\`/rollcall\` will send an everyone ping in the annoucements channel that will ask for attendance with buttons for yes/no. As users reply, the embed in the original message will update with whether users are in or if they need a sub, and messages will be sent to the attendance channel
				\`/restart\` will kill the service. As long as the bot is run using PM2, the bot will restart automatically making this an easy command to restart the bot
				\`/subs\` will send an everyone ping in the subs channel that will ask for subs. As users reply, the attendance channel will be notified of each person wanting to sub
			`);
			await interaction.followUp({ content: captainMessage, ephemeral: true });
		}
	},
};

function getUserRoles(interaction) {
	return interaction.member['_roles'];
}