const { team, venue, date } = require('./../data/next-match.json');
const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('subs')
		.setDescription('Run a sub rollcall for this week\'s pinball match')
		.setDefaultMemberPermissions('0'),
	async execute(interaction) {
		const subsChannel = getSubsChannel();
		const acceptButton = getReplyButton();
		await interaction.reply({ content: `Subs requested for match against **${team}** at **${venue}** on **${date}**`, ephemeral: true });
		await subsChannel.send({ content: `@here Someone is out this week on the normal roster so we could use your help! The upcoming match is on **${date}** at **${venue}** against **${team}** \n\nIf you would like to sub for the :contras: ontras this week, let us know by tapping the button below!`, components: [acceptButton] });
	},
};

function getReplyButton() {
	return new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('subs-accept')
				.setLabel('Blast some balls!')
				.setEmoji('1059189786910408714')
				.setStyle(ButtonStyle.Success),
		);
}

function getSubsChannel() {

	return process.env.SUBS_CHANNEL_ID;
}
