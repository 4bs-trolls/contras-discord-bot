const { SlashCommandBuilder } = require('discord.js');
const captain = process.env.CAPTAIN_ROLE_ID;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Breakdown of each command available'),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		const roles = getUserRoles(interaction);
		const isCaptain = roles.some(x => x === captain);

		// Message 1: General Commands
		const generalMessage = [
			'**📋 General Commands**',
			'',
			'• `/next-match` - Get date, venue, and opponent for your upcoming match',
			'• `/links` - View helpful league links',
			'• `/stats` - Get your IFPA/MatchPlay links (includes team stats)',
			'  └ **Optional:** `[ifpa]` `[match-play]` - Set your IDs',
			'• `/server` - View server name and member count',
			'• `/user` - View your username and join date',
			'• `/help` - Show this help message',
		].join('\n');

		// Message 2: Search Commands
		const searchMessage = [
			'**🔍 Search Commands** (Easy way to find IDs!)',
			'',
			'• `/search-player <player_name> [season]`',
			'  └ Search for a player with interactive buttons for quick stats',
			'• `/search-machine <machine_name> [season]`',
			'  └ Search for a machine and access statistics via buttons',
			'• `/search-team <team_name> [season]`',
			'  └ Search for a team and view performance data',
			'',
			'💡 **Partial names work!** Try "attack" to find "Attack from Mars"',
		].join('\n');

		// Message 3: Statistics Commands
		const statsMessage = [
			'**📊 Statistics Commands** (Use search to find IDs!)',
			'',
			'• `/avg-game <machine-id> [season]`',
			'  └ Average score for a machine across all players',
			'• `/player-machine-avg <player-id> <machine-id> [season]`',
			'  └ A player\'s average on a specific machine',
			'• `/machine-leaderboard <machine-id> [season] [limit]`',
			'  └ Top scores on a specific machine (🥇🥈🥉)',
			'• `/player-history <player-id> [season] [limit]`',
			'  └ Complete game history for a player',
			'• `/team-performance <team-id> [season]`',
			'  └ Team stats including matches and points',
			'• `/recent-scores <machine-id> [limit]`',
			'  └ Most recent scores on a specific machine',
			'• `/top-picks <team-id> [season] [limit]`',
			'  └ Machines an opposing team picks most often',
			'',
			'**✨ Pro Tips:**',
			'• Use season `0` for all-time stats (e.g., `/avg-game mm 0`)',
			'• Don\'t know the ID? Use search commands first!',
		].join('\n');

		// Send messages
		await interaction.editReply({ content: generalMessage, ephemeral: true });
		await interaction.followUp({ content: searchMessage, ephemeral: true });
		await interaction.followUp({ content: statsMessage, ephemeral: true });

		// Message 4: Captain Commands (if applicable)
		if (isCaptain) {
			const captainMessage = [
				'**👑 Captain Only Commands**',
				'',
				'• `/rollcall`',
				'  └ Send attendance ping with Yes/No buttons',
				'  └ Embed updates automatically as users respond',
				'  └ Messages sent to attendance channel',
				'• `/subs`',
				'  └ Send @everyone ping requesting substitute players',
				'  └ Attendance channel notified of each volunteer',
				'• `/restart`',
				'  └ Restart the bot (requires PM2 to auto-restart)',
				'',
				'**Note:** `/set-week` is deprecated - automatically syncs from database',
			].join('\n');
			await interaction.followUp({ content: captainMessage, ephemeral: true });
		}
	},
};

function getUserRoles(interaction) {
	return interaction.member['_roles'];
}