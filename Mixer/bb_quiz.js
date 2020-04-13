// For connecting to mixer
const Mixer = require('@mixer/client-node');
const ws = require('ws');

// For file writing
const fs = require('fs');

// Immediately hide everything with the css from the previous session
ToggleQuestionUI('hidden', 'hidden');

// fs required to read the json
var jsonData = JSON.parse(fs.readFileSync('Hot100.json', 'utf8'));
var jsonDataLength = jsonData.Weeks.length; // For iterating through the list, it's a big one to read each time

// Type of game tp be played. This is overwritten at the start of each round
var gameType = randomIntFromInterval(0,2); // 0,1,2

var UsersInPlayArray = []; // Who has fired an answer this round
var GameHasStarted = false; // If a game is in progress

// Position out of 3 (int); 1 ,2 ,3 - if '0' then something is broken
var RealAnswer = 0;
var BuiltAnswer = "";

// On answer, we +1 one of these based on a 1,2,3 answer (-1)
var ArrayOfPlayers = [0, 0, 0];
// String of account names which won
var PlayerGuesses = [];

var DelayBetweenGames = 180000; // ms
var TimeToVote = 10000; // ms
var TimeToDisplayResults = 10000; // ms


// Instantiate a new Mixer Client
// See the Mixer documentation for anything related to their system
// https://dev.mixer.com/
const client = new Mixer.Client(new Mixer.DefaultRequestRunner());

client.use(new Mixer.OAuthProvider(client, {
    tokens: {
        access: <replace_me>, // access: 'xxxj2kdl2j5er4il2rhew3i43lrhlwe423423',
        // Tokens retrieved via this page last for 1 year.
        expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
    },
}));

// Mixer
// Joins the bot to chat
async function joinChat(userId, channelId) {
    const joinInformation = await getConnectionInformation(channelId);
    const socket = new Mixer.Socket(ws, joinInformation.endpoints).boot();

    return socket.auth(channelId, userId, joinInformation.authkey).then(() => socket);
}

// Mixer
// Returns body resposne of bot joining chat
async function getConnectionInformation(channelId) {
    return new Mixer.ChatService(client).join(channelId).then(response => response.body);
}

// Mixer
// ...gets details about users in chat
async function getUserInfo() {
    return client.request('GET', 'users/current').then(response => response.body);
}


// No Mixer functions below this lineHeight
// ------------------------------------


// Random value between 2 numbers (*1000 for milliseconds)
function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

  
//START game
function startBBCompetition(socket) {
	gameType = randomIntFromInterval(0,2); // 0,1,2

	switch(gameType) {
		case 0:
			// As of <week>, how many weeks had <song> by <artist> appeared in the Billboard Hot 100?
			gameTypeZero(socket);
			break;
			
		case 1:
			// In the week of <week>, which single was <x> position in the Billboard Hot 100?
			gameTypeOne(socket);
			break;
			
		case 2:
			// At what position was <single> by <artist> in the Billboard Top Hot i the week of <week>?
			gameTypeTwo(socket);
			break;

		default:
			throw('Case is broken - should never get here');
	}
}


// GAMETYPES

/*
-- JSON explanation
0 = artist
1 = song
2 = instance ID (? - )
3 = previous_week_position
4 = peak_position
5 = total weeks in the chart (including this week)
*/

// This will hide or show the question/results area
function ToggleQuestionUI(QuestionToggle, ResultsToggle) {
	
	// Try to read the CSS file for styling
	try {
		var data = fs.readFileSync('index.css', 'utf8');
	} catch(e) {
		console.log('Error:', e.stack);
	}

	// Pull out the data we don't want to change, stripping out existing answers and questions
	var QuestionCssVarBefore = data.substring(0, (data.lastIndexOf("/*q-vis*/")+9));
	var QuestionCssVarAfter = data.substring(data.lastIndexOf("/*/q-vis*/"), (data.lastIndexOf("/*r-vis*/")+9));
	var ResultsCssVarAfter = data.substring(data.lastIndexOf("/*/r-vis*/"), data.length);

	// Build the HTML output, inserting our questions and answers
	var CompiledHTMLData = QuestionCssVarBefore + QuestionToggle + QuestionCssVarAfter + ResultsToggle + ResultsCssVarAfter;
	
	// Write the CSS with our compiled data
	fs.writeFileSync('index.css', CompiledHTMLData, (err) => {
	if (err) throw err;
		console.log('Error writing to file.');
		console.log(err);
	});
}


// This sets styling for results in the CSS area
// ...1,2,3
function ToggleResultsStyling(AnswerPosition) {

	// Try to read the CSS file for styling
	try {
		var data = fs.readFileSync('index.css', 'utf8');
	} catch(e) {
		console.log('Error:', e.stack);
	}

	// Pull out the data we don't want to change, stripping out existing answers and questions
	var BeforeTextStyling1 = data.substring(0, (data.lastIndexOf("/*r-a1st*/")+10));
	var BeforeQa1BGColour1 = data.substring(data.lastIndexOf("/*/r-a1st*/"), (data.lastIndexOf("/*r-a1c*/")+9));
	var BeforeQa1BGColour2 = data.substring(data.lastIndexOf("/*/r-a1c*/"), (data.lastIndexOf("/*r-a1c2*/")+10));
	
	var BeforeTextStyling2 = data.substring(data.lastIndexOf("/*/r-a1c2*/"), (data.lastIndexOf("/*r-a2st*/")+10));
	var BeforeQa2BGColour1 = data.substring(data.lastIndexOf("/*/r-a2st*/"), (data.lastIndexOf("/*r-a2c*/")+9));
	var BeforeQa2BGColour2 = data.substring(data.lastIndexOf("/*/r-a2c*/"), (data.lastIndexOf("/*r-a2c2*/")+10));
	
	var BeforeTextStyling3 = data.substring(data.lastIndexOf("/*/r-a2c2*/"), (data.lastIndexOf("/*r-a3st*/")+10));
	var BeforeQa3BGColour1 = data.substring(data.lastIndexOf("/*/r-a3st*/"), (data.lastIndexOf("/*r-a3c*/")+9));
	var BeforeQa3BGColour2 = data.substring(data.lastIndexOf("/*/r-a3c*/"), (data.lastIndexOf("/*r-a3c2*/")+10));

	var RestOfFile = data.substring(data.lastIndexOf("/*/r-a3c2*/"), data.length);

	// Change answer styling based on which one is correct!
	switch(AnswerPosition) {
		case 1:
			var TextStyling1Value = 'none';
			var TextStyling2Value = 'line-through';
			var TextStyling3Value = 'line-through';

			var BGColourArea1 = 'rgba(73,242,109,1)';
			var BGColourArea2 = 'rgba(242,224,73,0.5)';
			var BGColourArea3 = 'rgba(242,224,73,0.5)';
			break;

		case 2:
			var TextStyling1Value = 'line-through';
			var TextStyling2Value = 'none';
			var TextStyling3Value = 'line-through';

			var BGColourArea1 = 'rgba(242,224,73,0.5)';
			var BGColourArea2 = 'rgba(73,242,109,1)';
			var BGColourArea3 = 'rgba(242,224,73,0.5)';
			break;

		case 3:
			var TextStyling1Value = 'line-through';
			var TextStyling2Value = 'line-through';
			var TextStyling3Value = 'none';

			var BGColourArea1 = 'rgba(242,224,73,0.5)';
			var BGColourArea2 = 'rgba(242,224,73,0.5)';
			var BGColourArea3 = 'rgba(73,242,109,1)';
			break;
	}

	// Build the HTML output, inserting our questions and answers
	var CompiledHTMLData = BeforeTextStyling1 +TextStyling1Value+ BeforeQa1BGColour1 +BGColourArea1+ BeforeQa1BGColour2 +BGColourArea1+ BeforeTextStyling2 +TextStyling2Value+ BeforeQa2BGColour1 +BGColourArea2+ BeforeQa2BGColour2 +BGColourArea2+ BeforeTextStyling3 +TextStyling3Value+ BeforeQa3BGColour1 +BGColourArea3+ BeforeQa3BGColour2 +BGColourArea3+ RestOfFile;

	// Write the CSS with our compiled data
	fs.writeFileSync('index.css', CompiledHTMLData, (err) => {
	if (err) throw err;
		console.log('Error writing to file.');
		console.log(err);
	});
}


// As of <week>, how many weeks had <song> by <artist> appeared in the Billboard Hot 100?
function gameTypeZero(socket) {
	// Week to pull data from
	var selectedWeek = randomIntFromInterval(1, jsonDataLength) -1; // 0..jsonDataLength(-1)
	// Entry in the Top 100 to read from
	var selectedPosition = randomIntFromInterval(1, 100); // 1,2,3...,98,99,100
	
	// Storing week details for easy access later
	var qWeek = jsonData.Weeks[selectedWeek].TheWeek;
	var qArtist = jsonData.Weeks[selectedWeek].ChartData[selectedPosition][0];
	var qSong = jsonData.Weeks[selectedWeek].ChartData[selectedPosition][1];
	// Can use this for announcing to chat and verify match later
	var RealAnswerLocal = jsonData.Weeks[selectedWeek].ChartData[selectedPosition][5];
	
	// Question string we post to chat
	var builtQuestion = "As of \"" + qWeek + "\", how many weeks had the song \"" + qSong + "\" by \"" + qArtist + "\" appeared in the Billboard Hot 100?";

	// NOTE: RealAnswerLocal will never be 0 as the current week is counted. 1 is the minimum
	var answerArray = [];
	// Default add the correct answer to the array
	answerArray.push(RealAnswerLocal);

	// Cheap way to fix answers which are too low (1 would be an infinite loop)
	var MaxRandomAnswerValue = RealAnswerLocal + RealAnswerLocal / 2; // We divide by 2 to get an accurate range
	if (MaxRandomAnswerValue < 5) 
	{
		MaxRandomAnswerValue = 5;
	}

	// We'll pick 2 random numbers between 1 to (actual answer + 10)
	// ...try if it already exists in the array
	while (answerArray.length < 3) {
		var RandomAnswer = randomIntFromInterval(1, MaxRandomAnswerValue);
		if (answerArray.includes(RandomAnswer) == false) {
			answerArray.push(RandomAnswer);
		}
	}

	// Sort the answers for readability
	answerArray.sort(function(a, b){return a-b});

	// The answer position. Needs +1 because an array and we want 1,2,3
	RealAnswer = answerArray.indexOf(RealAnswerLocal) + 1;

	// Load the existing web page to memory as a string
	try {
		var data = fs.readFileSync('index.html', 'utf8');
	} catch(e) {
		console.log('Error:', e.stack);
	}

	// Pull out the data we don't want to change, stripping out existing answers and questions
	var QuestionStringBefore = data.substring(0, (data.lastIndexOf("<!--0-->")+8));
	var QuestionStringAfter = data.substring(data.lastIndexOf("<!--/0-->"), data.lastIndexOf("<!--1-->")+8);
	var AnswerOneStringAfter = data.substring(data.lastIndexOf("<!--/1-->"), data.lastIndexOf("<!--2-->")+8);
	var AnswerTwoStringAfter = data.substring(data.lastIndexOf("<!--/2-->"), data.lastIndexOf("<!--3-->")+8);
	var ResultQuestionStringBefore = data.substring(data.lastIndexOf("<!--/3-->"), data.lastIndexOf("<!--r0-->")+9);
	var ResultQuestionStringAfter = data.substring(data.lastIndexOf("<!--/r0-->"), data.lastIndexOf("<!--r1-->")+9);
	var ResultAnswerOneStringAfter = data.substring(data.lastIndexOf("<!--/r1-->"), data.lastIndexOf("<!--r2-->")+9);
	var ResultAnswerTwoStringAfter = data.substring(data.lastIndexOf("<!--/r2-->"), data.lastIndexOf("<!--r3-->")+9);
	var ResultAnswerThreeStringAfter = data.substring(data.lastIndexOf("<!--/r3-->"), data.length);

	// Build the HTML output, inserting our questions and answers
	var CompiledHTMLData = QuestionStringBefore + builtQuestion + QuestionStringAfter + answerArray[0] + AnswerOneStringAfter + answerArray[1] + AnswerTwoStringAfter + answerArray[2] + ResultQuestionStringBefore + builtQuestion + ResultQuestionStringAfter + answerArray[0] + ResultAnswerOneStringAfter + answerArray[1] + ResultAnswerTwoStringAfter + answerArray[2] + ResultAnswerThreeStringAfter;

	// Set the game started flag
	GameHasStarted = true;

	// Announce the question to chat
	socket.call("msg", ["/me Game starting!"]);
	
	// Change the UI
	ToggleQuestionUI('visibile', 'hidden');
	
	// Log this for reference to console... for cheating!
	console.log("ANSWER: " + RealAnswer);
	
	// Write the HTML with our compiled data
	fs.writeFileSync('index.html', CompiledHTMLData, (err) => {
	if (err) throw err;
		console.log('Error writing to file.');
		console.log(err);
	});

	// Build the answer
	BuiltAnswer = "The correct answer was \"" + RealAnswer + "\" - \"" + answerArray[RealAnswer -1] + "\" week(s)";
	
	// Set the Results css here as well, we'll toggle the visibility later
	ToggleResultsStyling(RealAnswer);
	
	setTimeout(endBBCompetition, TimeToVote, socket); // 4 mins (240) 8 mins (480)
}


// In the week of <week>, which single was <x> position in the Billboard Hot 100?
function gameTypeOne(socket) {
	// Week to pull data from
	var selectedWeek = randomIntFromInterval(1, jsonDataLength) -1; // 0..jsonDataLength(-1)
	// Entry in the Top 100 to read from
	var selectedPosition = randomIntFromInterval(1, 100); // 1,2,3...,98,99,100

	// Storing week details for easy access later
	var qWeek = jsonData.Weeks[selectedWeek].TheWeek;
	var qArtist = jsonData.Weeks[selectedWeek].ChartData[selectedPosition][0];
	var qSong = jsonData.Weeks[selectedWeek].ChartData[selectedPosition][1];
	
	// This question needs an option and built text string for answers
	// We'll get the correct position once the answer array is populated an sorted
	var RealAnswerText = "\"" + jsonData.Weeks[selectedWeek].ChartData[selectedPosition][1] + "\" by \"" + jsonData.Weeks[selectedWeek].ChartData[selectedPosition][0] + "\"";

	// Question string we post to chat
	var builtQuestion = "In the week of \"" + qWeek + "\", which single was at number \"" + selectedPosition + "\" in the Billboard Hot 100?";

	// NOTE: answers are, obviously, 1 to 100 (inc)
	var answerArray = [];
	// Default add the correct answer to the array
	answerArray.push(RealAnswerText);

	// We'll pick 2 random numbers between 1 to 100
	// ...try if it already exists in the array
	while (answerArray.length < 3) {
		var RandomAnswer = randomIntFromInterval(1, 100);
		if (RandomAnswer != selectedPosition) // Is not the answer
		{
			var WrongAnswerText = "\"" + jsonData.Weeks[selectedWeek].ChartData[RandomAnswer][1] + "\" by \"" + jsonData.Weeks[selectedWeek].ChartData[RandomAnswer][0] + "\"";
			answerArray.push(WrongAnswerText);
		}
	}

	// Sort the answers for readability
	answerArray.sort();

	// The answer position. Needs +1 because an array and we want 1,2,3
	RealAnswer = answerArray.indexOf(RealAnswerText) + 1;

	// Load the existing web page to memory as a string
	try {
		var data = fs.readFileSync('index.html', 'utf8');
	} catch(e) {
		console.log('Error:', e.stack);
	}

	// Pull out the data we don't want to change, stripping out existing answers and questions
	var QuestionStringBefore = data.substring(0, (data.lastIndexOf("<!--0-->")+8));
	var QuestionStringAfter = data.substring(data.lastIndexOf("<!--/0-->"), data.lastIndexOf("<!--1-->")+8);
	var AnswerOneStringAfter = data.substring(data.lastIndexOf("<!--/1-->"), data.lastIndexOf("<!--2-->")+8);
	var AnswerTwoStringAfter = data.substring(data.lastIndexOf("<!--/2-->"), data.lastIndexOf("<!--3-->")+8);
	var ResultQuestionStringBefore = data.substring(data.lastIndexOf("<!--/3-->"), data.lastIndexOf("<!--r0-->")+9);
	var ResultQuestionStringAfter = data.substring(data.lastIndexOf("<!--/r0-->"), data.lastIndexOf("<!--r1-->")+9);
	var ResultAnswerOneStringAfter = data.substring(data.lastIndexOf("<!--/r1-->"), data.lastIndexOf("<!--r2-->")+9);
	var ResultAnswerTwoStringAfter = data.substring(data.lastIndexOf("<!--/r2-->"), data.lastIndexOf("<!--r3-->")+9);
	var ResultAnswerThreeStringAfter = data.substring(data.lastIndexOf("<!--/r3-->"), data.length);

	// Build the HTML output, inserting our questions and answers
	var CompiledHTMLData = QuestionStringBefore + builtQuestion + QuestionStringAfter + answerArray[0] + AnswerOneStringAfter + answerArray[1] + AnswerTwoStringAfter + answerArray[2] + ResultQuestionStringBefore + builtQuestion + ResultQuestionStringAfter + answerArray[0] + ResultAnswerOneStringAfter + answerArray[1] + ResultAnswerTwoStringAfter + answerArray[2] + ResultAnswerThreeStringAfter;
	
	// Set the game started flag
	GameHasStarted = true;
	
	// Announce the question to chat
	socket.call("msg", ["/me Game starting!"]);
	
	// Change the UI
	ToggleQuestionUI('visibile', 'hidden');
	
	// Log this for reference to console... for cheating!
	console.log("ANSWER: " + RealAnswer);
	
	// Write the HTML with our compiled data
	fs.writeFileSync('index.html', CompiledHTMLData, (err) => {
	if (err) throw err;
		console.log('Error writing to file.');
		console.log(err);
	});
	// Build the answer
	BuiltAnswer = "The correct answer was \"" + RealAnswer + "\" - \"" + qSong + "\" by \"" + qArtist + "\"";
	
	// Set the Results css here as well, we'll toggle the visibility later
	ToggleResultsStyling(RealAnswer);

	setTimeout(endBBCompetition, TimeToVote, socket); // 4 mins (240) 8 mins (480)
}


// In the week of <week>, at which position was <single> by <artist> in the Billboard Hot 100?
function gameTypeTwo(socket) {
	// Week to pull data from
	var selectedWeek = randomIntFromInterval(1, jsonDataLength) -1; // 0..jsonDataLength(-1)
	
	// Entry in the Top 100 to read from
	// ...this is also the answer
	var selectedPosition = randomIntFromInterval(1, 100); // 1,2,3...,98,99,100

	// Storing week details for easy access later
	var qWeek = jsonData.Weeks[selectedWeek].TheWeek;
	var qArtist = jsonData.Weeks[selectedWeek].ChartData[selectedPosition][0];
	var qSong = jsonData.Weeks[selectedWeek].ChartData[selectedPosition][1];

	// Question string we post to chat
	var builtQuestion = "In the week of \"" + qWeek + "\", at which position was \"" + qSong + "\" by \"" + qArtist + "\" in the Billboard Hot 100?";

	// NOTE: answers are, obviously, 1 to 100 (inc)
	var answerArray = [];
	// Default add the correct answer to the array
	answerArray.push(selectedPosition);

	// We'll pick 2 random numbers between 1 to (actual answer + 10)
	// ...try if it already exists in the array
	while (answerArray.length < 3) {
		var RandomAnswer = randomIntFromInterval(1, 100);
		if (answerArray.includes(RandomAnswer) == false) {
			answerArray.push(RandomAnswer);
		}
	}

	// Sort the answers for readability
	answerArray.sort(function(a, b){return a-b});

	// The answer position. Needs +1 because an array and we want 1, 2, 3
	RealAnswer = answerArray.indexOf(selectedPosition) + 1;

	// Load the existing web page to memory as a string
	try {
		var data = fs.readFileSync('index.html', 'utf8');
	} catch(e) {
		console.log('Error:', e.stack);
	}

	// Pull out the data we don't want to change, stripping out existing answers and questions
	var QuestionStringBefore = data.substring(0, (data.lastIndexOf("<!--0-->")+8));
	var QuestionStringAfter = data.substring(data.lastIndexOf("<!--/0-->"), data.lastIndexOf("<!--1-->")+8);
	var AnswerOneStringAfter = data.substring(data.lastIndexOf("<!--/1-->"), data.lastIndexOf("<!--2-->")+8);
	var AnswerTwoStringAfter = data.substring(data.lastIndexOf("<!--/2-->"), data.lastIndexOf("<!--3-->")+8);
	var ResultQuestionStringBefore = data.substring(data.lastIndexOf("<!--/3-->"), data.lastIndexOf("<!--r0-->")+9);
	var ResultQuestionStringAfter = data.substring(data.lastIndexOf("<!--/r0-->"), data.lastIndexOf("<!--r1-->")+9);
	var ResultAnswerOneStringAfter = data.substring(data.lastIndexOf("<!--/r1-->"), data.lastIndexOf("<!--r2-->")+9);
	var ResultAnswerTwoStringAfter = data.substring(data.lastIndexOf("<!--/r2-->"), data.lastIndexOf("<!--r3-->")+9);
	var ResultAnswerThreeStringAfter = data.substring(data.lastIndexOf("<!--/r3-->"), data.length);

	// Build the HTML output, inserting our questions and answers
	var CompiledHTMLData = QuestionStringBefore + builtQuestion + QuestionStringAfter + answerArray[0] + AnswerOneStringAfter + answerArray[1] + AnswerTwoStringAfter + answerArray[2] + ResultQuestionStringBefore + builtQuestion + ResultQuestionStringAfter + answerArray[0] + ResultAnswerOneStringAfter + answerArray[1] + ResultAnswerTwoStringAfter + answerArray[2] + ResultAnswerThreeStringAfter;
	
	// Set the game started flag
	GameHasStarted = true;

	// Announce the question to chat
	socket.call("msg", ["/me Game starting!"]);
	
	// Change the UI
	ToggleQuestionUI('visibile', 'hidden');
	
	// Log this for reference to console... for cheating!
	console.log("ANSWER: " + RealAnswer);
	
	// Write the HTML with our compiled data
	fs.writeFileSync('index.html', CompiledHTMLData, (err) => {
	if (err) throw err;
		console.log('Error writing to file.');
		console.log(err);
	});

	// Build the answer
	BuiltAnswer = "The correct answer was \"" + RealAnswer + "\" - position \"" + answerArray[RealAnswer -1] + "\"";

	// Set the Results css here as well, we'll toggle the visibility later
	ToggleResultsStyling(RealAnswer);

	setTimeout(endBBCompetition, TimeToVote, socket); // 4 mins (240) 8 mins (480)
}
// \GAMETYPES


//END game
function endBBCompetition(socket) {
	var CorrectAnswerCount = ArrayOfPlayers[RealAnswer-1];
	var TotalPlayers = UsersInPlayArray.length;

	// Immediately stop the game
	GameHasStarted = false;

	// Update UI
	// Add the stats to the results screen
	// Load the existing web page to memory as a string
	try {
		var data = fs.readFileSync('index.html', 'utf8');
	} catch(e) {
		console.log('Error:', e.stack);
	}

	// Pull out the data we don't want to change, stripping out existing answers and questions
	var BeforeText = data.substring(0, (data.lastIndexOf("<!--winstats-->")+15));
	var AfterText = data.substring(data.lastIndexOf("<!--/winstats-->"), data.length);

	// Build the HTML output, inserting our questions and answers
	var CompiledHTMLData = BeforeText + CorrectAnswerCount + " out of " + TotalPlayers + " player(s) got it right" + AfterText;

	// Write the HTML with our compiled data
	fs.writeFileSync('index.html', CompiledHTMLData, (err) => {
	if (err) throw err;
		console.log('Error writing to file.');
		console.log(err);
	});

	// Update UI
	// ...hide the question area, show results
	ToggleQuestionUI('hidden', 'visible');

	// Announce answer and number of winners in chat
	socket.call("msg", ["/me " + BuiltAnswer]);
	//socket.call("msg", ["/me " + CorrectAnswerCount + " out of " + TotalPlayers + " player(s) got it right."]);
	console.log(CorrectAnswerCount + " out of " + TotalPlayers + " player(s) got it right.");
	
	// Clear the answers array
	ArrayOfPlayers = [0, 0, 0];
	
	// Clear the players array so users can play again next round
	// Do it here to free up memory (not much) after the game ends
	UsersInPlayArray = [];
	
	console.log("Note: position is -1 because it's an array. Add 1 for actual vote");
	console.log(PlayerGuesses);
	PlayerGuesses = []
	
	// Show the results screen after 'TimeToDisplayResults' time
	setTimeout(ResultsScreenShow, TimeToDisplayResults, socket);
}


// RESULTS screen
function ResultsScreenShow(socket) {
	// Update UI
	// ...hide results and question(should already be hidden) areas
	ToggleQuestionUI('hidden', 'hidden');

	// Start the competition again in 'DelayBetweenGames' amount of time
	setTimeout(startBBCompetition, DelayBetweenGames, socket);
}


// Start the bot / join it to chat
getUserInfo().then(async userInfo => {
	// used to join specific channel and verify users messaging the bot are in that channel
	const targetChannelID = <replace_me>; // example: targetChannelID = 123456789

	// Joins the bot to the channel
	const socket = await joinChat(userInfo.id, targetChannelID);

	// Starts the game
	// (function, time before game starts in ms, joinChat)
	// ...if set too low (less than a second) it may not fire the initial chat message as the bot can take a while to join chat
	setTimeout(startBBCompetition, DelayBetweenGames, socket);

    // Send a message once connected to chat.
	// Optional; announces to chat the bot is now online
	// We could whisper a new user whenever they join but it adds to the interaction if they have to ask the host/clients
    socket.call("msg", ["/me Billboard Hot 100 Quiz bot online!"]);

    // Looks for any chat message (main chat, whispers...)
	// For this game we don't care if people spam main chat with the command, if we did we'd force the bot to only listen for whispers
	// -- data.message.meta[0].whisper == true)
	// -- https://dev.mixer.com/reference/chat/events/chatmessage
    socket.on('ChatMessage', data => {

		// Verify the users are in our channel.
		// We don't want people whispering from another channel, silently ignore them
		if (data.channel == targetChannelID){
		
			// If the message has contents we can read
			if (data.message.message[0].data)
			{
				// Here we read the messages and branch off if we find one containing specific text
				// ...
				
				// If a user says '!chinpokobot' we whisper them with info about the bot/game
				if (data.message.message[0].data.toLowerCase().startsWith("!bbinfo"))
				{
					socket.call("whisper", [data.user_name, "When a quiz starts, shout !1, !2 or !3 in chat to make a guess. You don't have long to do it!"]);
				}
				else {
					if (GameHasStarted == true)
					{
						// Variable for determining whether the user has played this round - 0 for not found
						var HasUserPlayedThisSession = false;

						// Check if user has played this session
						// Look through the array count the number of times this users name appears (if any)
						// We could use a 2D array ( [[][].[]] ), however that would require extra coding to append the data
						// ...this way we keep it short and simple as the array is cleared on game end anyway
						for (const [index, content] of UsersInPlayArray.entries()) {
							if ( content === data.user_id ) {
								HasUserPlayedThisSession = true; // We don't care about them
								break;
							}
						}
						
						// If the user has goes left, let them play
						// ...if we wanted to give followers of subscribers more attempts, we could case them here and add numbers to 'DefaultChancesPerUser'
						if (HasUserPlayedThisSession == false)
						{
							const commandName = data.message.message[0].data.toLowerCase().trim();
							var PositionToAdd = -1;

							if (commandName === '!1') {
								PositionToAdd = "0";
							}
							else if (commandName === '!2') {
								PositionToAdd = "1";
							}
							else if (commandName === '!3') {
								PositionToAdd = "2";
							}

							// If a selection has been made
							if (PositionToAdd > -1) {
								ArrayOfPlayers[PositionToAdd] += 1;
								
								// Add the user to the array, reducing the number of goes by 1
								// Only do it on valid answer...
								UsersInPlayArray.push(data.user_id);
								PlayerGuesses.push([data.user_name, PositionToAdd]);
							}
						}
					}
				}
			}
		}
    });

    // Handle errors
    socket.on('error', error => {
        console.error('Socket error');
        console.error(error);
    });
});