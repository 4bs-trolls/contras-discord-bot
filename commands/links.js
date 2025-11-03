const { SlashCommandBuilder } = require('discord.js');
const { stripIndent } = require('common-tags');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('links')
		.setDescription('Replies with helpful links'),
	async execute(interaction) {
		await interaction.reply(stripIndent`
		**Team Pages**
		<https://www.mondaynightpinball.com/teams/TRL>
		<http://pinballstats.info/search/iprsearch.pl?q=TRL>
		**Table Info**
		<https://pintips.net/>
		<https://replayfoundation.org/papa/>
		**Pinball Apps**
		<https://pinballmap.com/>
		<https://pindigo.app/>
		`);
	},
};