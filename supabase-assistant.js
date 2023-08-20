const {createClient} = require("@supabase/supabase-js");
const supabaseUrl = 'https://nwpgecjxpwvdwoczvuwr.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey)
const scheduleTableName = process.env.SCHEDULE_TABLE;


async function getUpcomingMatch() {
    let {data: upcomingMatches, error} = await supabase
        .from(scheduleTableName)
        .select('week, date, venue, venues(name), opponent, teams(name)')
        .eq('season', 18) // TODO: Update this to be a constant
        .gte('date', new Date().toDateString())
        .order('date', {ascending: true})
        .limit(1);

    if (upcomingMatches.length === 0) {
        return 'There are no upcoming matches';
    } else {
        const week = upcomingMatches[0].week;
        const date = new Date(upcomingMatches[0].date).toLocaleString('en-US', {timeZone: 'UTC', month: 'long', day: 'numeric'})
        const venue = upcomingMatches[0].venues.name;
        const team = upcomingMatches[0].teams.name;
        return {week, date, venue, team};
    }
}

module.exports = {
    getUpcomingMatch
}