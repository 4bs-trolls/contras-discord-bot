const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set-week')
		.setDescription('Set the variables for the current weeks match')
		.addStringOption(option =>
			option
				.setName('date')
				.setDescription('Date of the match in {Mmm DD} format. i.e. Jan 23rd')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('venue')
				.setDescription('Venue of the match')
				.setAutocomplete(true)
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('team')
				.setDescription('3 letter code, as determined by MNP, for the team we are up against this week. i.e. CDC for Contras')
				.setRequired(true))
		.setDefaultMemberPermissions('0'),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		console.log(focusedValue);
		const choices = [
			'4Bs Tavern',
			'8-bit Arcade Bar',
			'Add-a-Ball',
			'Admiral Pub',
			'Another Castle',
			'Coindexter\'s',
			'Corner Pocket Billiards and Lounge',
			'Georgetown Pizza and Arcade',
			'Hounds Tooth',
			'Ice Box',
			'Jupiter',
			'Kraken',
			'Olaf\'s',
			'Raygun Lounge',
			'Seattle Tavern and Pool Hall',
			'Shorty\'s',
			'Time Warp',
			'Touchdown',
			'Waterland'];
		const filtered = choices.filter(choice => choice.startsWith(focusedValue));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
	async execute(interaction) {
		const date = interaction.options.getString('date');
		const venue = interaction.options.getString('venue');

		const aTeamCode = interaction.options.getString('team');
		const aTeamCodeFormatted = aTeamCode.toUpperCase();
		let team = '';
		let message = '';

		// TODO: Add 'The B Team' and 'Neuromancers' to this list and use autocomplete
		switch (aTeamCodeFormatted) {
		case 'ADB': team = 'Admiraballs'; break;
		case 'BOC': team = 'Ball of Cthulhu'; break;
		case 'CRA': team = 'Castle Crashers'; break;
		case 'CFB': team = 'Chill Flippin Ballers'; break;
		case 'CDC': team = 'Contras'; break;
		case 'DTP': team = 'DTP'; break;
		case 'DSV': team = 'Death Savers'; break;
		case 'DIH': team = 'Drain in Hell'; break;
		case 'ETB': team = 'Eighteen Ball Deluxe'; break;
		case 'HHS': team = 'Hellhounds'; break;
		case 'KNR': team = 'Knight Riders'; break;
		case 'LAS': team = 'Little League All Stars'; break;
		case 'RMS': team = 'Magic Saves'; break;
		case 'JMF': team = 'Middle Flippers'; break;
		case 'NLT': team = 'Northern Lights'; break;
		case 'CPO': team = 'Pants Optional'; break;
		case 'OLD': team = 'Pinballycule'; break;
		case 'PGN': team = 'Pinguins'; break;
		case 'PKT': team = 'Pocketeers'; break;
		case 'PBR': team = 'Point Breakers'; break;
		case 'RTR': team = 'Ramp Tramps'; break;
		case 'SCN': team = 'Seacorns'; break;
		case 'SHK': team = 'Sharks'; break;
		case 'SSS': team = 'Silverball Slayers'; break;
		case 'SKP': team = 'Slap Kraken Pop'; break;
		case 'SWL': team = 'Specials When Lit'; break;
		case 'TTT': team = 'The Trailer Trashers'; break;
		case 'TWC': team = 'The Wrecking Crew'; break;
		default: team = aTeamCode; break;
		}

		try {
			const variablesJson = path.join('./', 'data', 'variables.json');
			// eslint-disable-next-line prefer-const
			let data = JSON.parse(fs.readFileSync(variablesJson));

			data.thisWeek.team = team;
			data.thisWeek.venue = venue;
			data.thisWeek.date = date;

			const jsonData = JSON.stringify(data);
			fs.writeFileSync(variablesJson, jsonData);

			message = 'This week has been set to:\n\n`Date:` *' + date + '* \n`Venue:` *' + venue + '* \n`Team:` *' + team + '*';
		} catch (e) {
			message = 'Failed to set and save this week\'s data due to: ' + e;
		}

		await interaction.reply(message);
	},
};