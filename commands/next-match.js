const {SlashCommandBuilder} = require('discord.js');
const path = require('path');

const supabase = require( path.join(__dirname, '../supabase-assistant.js') )

module.exports = {
    data: new SlashCommandBuilder()
        .setName('next-match')
        .setDescription('View the upcoming match details'),

    async execute(interaction) {
        let message = '';
        try {
            let result = await supabase.getUpcomingMatch();
            if (result === 'There are no upcoming matches') {
                message = result;
            } else {
                const date = result.date;
                const venue = result.venue;
                const team = result.team;
                message = 'The upcoming match is:\n\n`Date:` *' + date + '* \n`Venue:` *' + venue + '* \n`Team:` *' + team + '*';
            }

        } catch (e) {
            message = 'Failed to retrieve this week\'s data';
        }

        await interaction.reply(message);
    },
};