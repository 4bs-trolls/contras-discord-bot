# trolls-discord-bot

A Discord bot for the [4Bs TROLLS!](https://www.mondaynightpinball.com/teams/CDC) team in the [Seattle Monday Night Pinball](https://www.mondaynightpinball.com/) league

**Captain Commands:**
`/rollcall` will send an `@everyone` ping in the annoucements channel that will ask for attendance with buttons for yes/no. As users reply, the embed in the original message will update with whether users are in or if they need a sub, and messages will be sent to the attendance channel.  
`/restart` will kill the service. As long as the bot is run using PM2, the bot will restart automatically making this an easy command to restart the bot  
`/subs` will send an `@everyone` ping in the subs channel that will ask for subs. As users reply, the attendance channel will be notified of each person wanting to sub.

**User Commands:**  
`/next-match` will retrieve the Date, Venue, and Team for the upcoming match  
`/links` returns a set of helpful links  
`/stats` returns your IFPA/MatchPlay links, if set; always includes the team stats link  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**Optional Params [`ifpa`, `match-play`]:** sets the IFPA/MatchPlay ID for your Discord user  
`/help` returns a help message to the user with an explanation of all the command similar to this readme  
`/server` returns the name of the server and how many users it has  
`/user` returns the Username of the user who ran the command, and the date/time they joined the server  

**Search Commands** (Find players, machines, and teams easily!)  
`/search-player <name> [season]` - Search for a player by name and view quick stats with interactive buttons  
`/search-machine <name> [season]` - Search for a pinball machine by name and access statistics via buttons  
`/search-team <name> [season]` - Search for a team by name and view performance data  

**Statistics Commands:**  
`/avg-game <machine> [season]` - Get the average score for a specific pinball machine across all players  
`/player-machine-avg <player> <machine> [season]` - Get a player's average score on a specific machine  
`/leaderboard [season] [limit]` - View top players ranked by average score  
`/machine-leaderboard <machine> [season] [limit]` - View top scores on a specific machine  
`/player-history <player> [season] [limit]` - View a player's complete game history  
`/team-performance <team> [season]` - View team performance statistics including matches played and points  
`/recent-scores [limit]` - View the most recent game scores across all players  
`/top-picks <team> [season] [limit]` - View which machines an opposing team picks most frequently  

**Notes:**  
- All statistics commands default to the current season if no season is specified  
- Use search commands to easily find player/machine/team IDs if you don't know them  
- Interactive buttons appear after searches to quickly access common statistics  