Streaming Bot - Billboard Hot 100 Competition Bot
=================================================
A fully functioning competition chat bot. It reads from a JSON data file, randomly compiles from 1 of 3 possible question types, generates a random question and answers then starts. Competition is rendered in a local HTML file (no need for a web server) which can be rendered on an OBS stream.

Every x seconds (3 minutes default) a competition triggers with a generated HTML to display on a stream. The question could be announced in chat, but we should try to keep that clean. Users have 3 possible answers to choose from. They select an answer in main chat by shouting !1, !2 or !3. Each player has 1 chance per question and can't change their answer. After x seconds (default 10) the competition ends and the HTML changes to a results page. After x seconds (default 10) the results page is removed and nothing is displayed in the HTML so it can remain onscreen until the next competition.

Can be adapted to any data set for any quiz but will require a lot of configuration.

I KNOW... that dynamically updating the HTML and CSS in the way I have is very bad. It was the simplest way I could think of without using a ton of external libraries. The idea is to keep these bots simple so an average streamer can figure them out.

The Billboard Hot 100 data is apparently available from Billboard. They hang it out there. The first link I found was on some dodgy looking website, but the data seems to be correct. I validated a couple of entries. I've had to convert it from an insanely chaotic csv to a well ordered JSON. It's not sorted by date (ascending) and song ranks (ascending).

Could be adapted in to a poll bot but I wouldn't recommend it. I have another bot in the works for that.

Twitch doesn't fully support whispers, Mixer does. I created a new Twitch account and 3 days later I was still unable to send whispers. Apparently this is intentional as some form of anti-spam? It's ridiculous and greatly reduces the viability of this game. There's a Twitch script regardless.


LEGAL STUFF:
============
You do not have permission to use or modify any of the content in this reprository if...

...you are an e-beggar, tit streamer or someone who can't be bothered to try at real job and provide some worth to society. If you're the kind of person who is featured on the Mixer homepage then this is not for you. If you spend your time in the 'just chatting' portion of Twitch or have a pre-stream, this is not for you.

If in doubt, mail me with a link to verify your societal status.

If this breaks something or you get banned for using it, that's your problem not mine.


REQUIREMENTS:
=============
Each scripts is intended to run from an account, either Twitch or Mixer. You can create a new account or use your host account.

Scripts can be run from any machine. They don't need to be on the hosting computer and should work on Windows or Linux as they're Node.js scripts.


MIXER:
======
It's assumed users have followed the installation on the dev sites...
Ref: https://dev.mixer.com/guides/chat/introduction
Ref: https://dev.mixer.com/guides/chat/chatbot

Search the script for '<replace_me>' and replace the details as they're found:

- access: <replace_me>,
-- This can be found on the '/chatbot' link above by clicking the link in the matching code (simplest way of finding it)

- const targetChannelID = <replace_me>
-- This can be found: https://mixer.com/api/v1/channels/<channel_name>?fields=id
-- Obviously change 'channel_name' to the name of the channel you want to join

Run the script: node bb_quiz.js
- When a collectible spawns, say '!catch' in chat to try and catch it
-- Users whould really whisper the bot with '!catch', however it will accept regular channel messages
- Users are whispered how many goes they have remaining and whether they have failed
- A win is announced globally in chat and logged to file with user id, name, date and capture details


TWITCH:
=======
It's assumed users have followed the installation on the dev sites...
Ref: https://dev.mixer.com/guides/chat/introduction


Search the script for '<replace_me>' and replace the details as they're found:

- username: <replace_me>
-- Name of the bot account

- password: <replace_me>
-- When logged in to the Twitch bot account, go to this page and connect:
--- https://twitchapps.com/tmi/
-- The entire string: 'oauth:oauth:jnmki23o9278h4kjhe9w843vew9ewaa7'

- channels: [ <replace_me> ]
-- Name of the channel to join as it appears in a browser such as: https://www.mixer.com/replace_me


Run the script: node bb_quiz.js
- When a collectible spawns, say '!catch' in chat to try and catch it
- There's no feedback on Twitch for failing to catch due to the terrible way they restrict whispers
- A win is announced globally in chat and logged to file with user id, name, date and capture details


CONFIGURATION:
==============
Hopefully the comments in the code make some sense.

Mixer and Twitch script structures have been kept a lot closer in this project. This can become quite confusing to anyone who's not me. There are 4 files in each folder which...

- bb_quiz.js
  -The node script you need to run
  - Remember to open and change the 'replace_me' values to your details first!
- Hot100.json
  - The Billboard data file
  - It's 336,524 lines long so brace yourself
  - May be a good idea to strip out anything pre-1990 if you're worried about the ~20mb size
- index.html
  - The web page to render in OBS
  - You don't need a web server:
    - Add a new 'Browser' source
    - Right-click it and open 'Properties'
    - Check the 'Local file' box
    - Point 'Local File' to the HTML
    - It should be invisible until a game starts
    - ...if the script is closed when a game is active, it may be visible but once the game is restarted it will immediately hide rpevious sessions
  - This page refreshes every second and may cause a slight flash, but this was the simplest way I could find to trigger a refresh as OBS would (will) not pick up page changes without it
- index.css
  - CSS for the HTML
  - Does what CSS does
  
The node script should be easy enough to follow with a lot of patience. I'm not a programmer.

As mentioned at the top of this file, the HTML/CSS updating is not something you would put in to a paid production project. It's good enough for streaming games with friends and having a laugh. The HTML and CSS files are rewritten by the Node script when a competition triggers, shows results or ends. Anything relating to Java is vile and should not be used by anyone, ever. I didn't want to make ASP or PHP pages which are require additional learning from end users. So I went with HTML rewrites. How does that work?

The CSS and HTML files have multi-line comments formed such as:
- <!--1-->"Far Away" by "Nickelback"<!--/1-->

...unintentional, that just happened to be the last question which was up! The Node script would look for the tage '<!--1-->' then '<!--/1-->' and replace anything between. Job done. It's not fantastically fast but the HTML and CSS are small so it's fast enough. A lot could be done to speed up the process or use fewer resources. Maybe that's something to look for in the future. Maybe this will convince someone to stop streaming, learn something then teach me!


LIVE DEMO:
==========
Available on request. I have a Mixer and Twitch demo channel used for developing and testing stream tools:
- https://mixer.com/1738_Creations
- https://www.twitch.tv/1738_creations

...the bots only run when I stream. If you'd like a demo then send a request (1738creations@gmail.com) with the stream name and I'll set them up.



======================

Shout out Sean Ranklin

Pig-ups Liquid Richard.


Covid19 isn't a threat. The numbers don't lie, people do. Stop using social media and supporting mainstream fake news. The WHO are corrupt.
