const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const SupabaseHelper = require('../helpers/SupabaseHelper')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('subs')
		.setDescription('Run a sub rollcall for this week\'s pinball match')
		.setDefaultMemberPermissions('0'),
	async execute(interaction) {
		try {
			const result = await SupabaseHelper.getUpcomingMatch();
			if (result === 'There are no upcoming matches') {
				await interaction.reply({ content: 'There are no upcoming matches to rollcall for', ephemeral: true });
			} else {
				const {week, date, venue, team} = result;
				const subsChannel = interaction.client.channels.cache.get(process.env.SUBS_CHANNEL_ID);
				const acceptButton = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('subs-accept')
							.setLabel('Blast some balls!')
							.setEmoji('1059189786910408714')
							.setStyle(ButtonStyle.Success),
					);
				await interaction.reply({ content: `Subs requested for match against **${team}** at **${venue}** on **${date}**`, ephemeral: true });
				await subsChannel.send({ content: `@here Someone is out this week on the normal roster so we could use your help! We are looking for subs for Week ${week} - **${date}** at **${venue}** against **${team}** \n\nIf you would like to sub for the TROLLS! this week, let us know by tapping the button below!`, components: [acceptButton] });

			}

		} catch (e) {
			await interaction.reply({ content: 'Failed to retrieve this week\'s data', ephemeral: true });
		}
	},
};

