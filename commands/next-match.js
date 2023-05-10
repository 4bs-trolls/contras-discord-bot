const {SlashCommandBuilder} = require('discord.js');
const {createClient} = require('@supabase/supabase-js');

const supabaseUrl = 'https://nwpgecjxpwvdwoczvuwr.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = {
    data: new SlashCommandBuilder()
        .setName('next-match')
        .setDescription('View the upcoming match details'),

    async execute(interaction) {
        let message = '';
        try {
            let {data: upcomingMatches, error} = await supabase
                .from('schedule')
                .select('date, venue, venues(name), opponent, teams(name)')
                .eq('season', 17) // TODO: Update this to be a constant
                .gte('date', new Date().toDateString())
                .order('date', {ascending: true})
                .limit(1);

            if (upcomingMatches.length === 0) {
                message = 'There are no upcoming matches';
            } else {
                const date = new Date(upcomingMatches[0].date).toLocaleString('en-CA', {month: 'short', day: 'numeric'})
                const venue = upcomingMatches[0].venues.name;
                const team = upcomingMatches[0].teams.name;

                message = 'The upcoming match is:\n\n`Date:` *' + date + '* \n`Venue:` *' + venue + '* \n`Team:` *' + team + '*';
            }
        } catch (e) {
            message = 'Failed to retrieve this week\'s data';
        }

        await interaction.reply(message);
    },
};