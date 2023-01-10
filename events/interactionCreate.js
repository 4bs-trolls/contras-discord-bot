const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(`Error executing ${interaction.commandName}`);
				console.error(error);
			}
		} else if (interaction.isButton() && interaction.message.embeds[0]) {
			const embed = interaction.message.embeds[0];
			let newEmbed;
			if (interaction.customId === 'rollcall-accept') {
				newEmbed = EmbedBuilder.from(embed).addFields({ name: interaction.member.nickname, value: 'is in!' });
				await interaction.reply({ content: 'You are in!', ephemeral: true });
			} else if (interaction.customId === 'rollcall-decline') {
				newEmbed = EmbedBuilder.from(embed).addFields({ name: interaction.member.nickname, value: 'needs a sub!' });
				await interaction.reply({ content: 'We will find you a sub :smile:', ephemeral: true });
			}
			await interaction.message.edit({ embeds: [newEmbed] });
		} else if (interaction.isAutocomplete()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.autocomplete(interaction);
			} catch (error) {
				console.error(error);
			}
		}
	},
};