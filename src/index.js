import { Hono } from "hono";
import { Story } from "inkjs";
import { html, raw } from "hono/html";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { logger } from "hono/logger";

import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * @param {string | Buffer | URL} directoryPath
 * @returns {Promise<string[]>} - Array of long file paths
 */
async function getFiles( directoryPath ) {

    try {
        const fileNames = await readdir( directoryPath ); // returns a JS array of just short/local file-names, not paths.
        // const filePaths = fileNames.map( fn => join( directoryPath, fn ) );
        return fileNames;
    }
    catch (err) {
        console.error( err ); // depending on your application, this `catch` block (as-is) may be inappropriate; consider instead, either not-catching and/or re-throwing a new Error with the previous err attached.
    }
}




const app = new Hono();

app.use("*", logger());

app.use("*", async (c, next) => {
	await next();
  	if (c.error) {
    	console.error(c.error)
  	}
});

app.get("/", async (c) => {
	const stories = await getFiles(import.meta.dir + '/stories')
	console.log('stories', stories)
	return c.html(
		<body>
			<h1>InkJS-Hono Demo</h1>
			<form action="/continue">
				<label for="storyChoice">Choose Story</label>
				<select id="storyChoce" name="storyChoice">
					{stories.map(story => <option id={story} value={story}>{story}</option>)}
				</select>
				<br/>
				<input type="submit" value="Start"/>
			</form>
			{/* <a href="/restart">Restart</a> */}
		</body>
	)
})

app.use('/continue', async (c, next) => {
	c.setRenderer((content) => {
		// console.log('content', content)
		return c.html(
			<html>
				<body>
					<div>
						{content.paragraphs.length > 0 ? (
							content.paragraphs.map(p => <p>{p}</p>)
						) : ""}
					</div>
					<ul>
						{content.choices.length > 0 ? (
							content.choices.map(choice => <li><a href={`/continue?storyChoice=${content.storyChoice}&choice=${choice.choice}`}>{choice.label}</a></li>)
						): null}
					</ul>
				</body>
			</html>
		)
	})
	await next()
})

app.get("/version", (c) => c.json({ version: "0.1" }))

app.get("/restart", (c) => {
	deleteCookie(c, 'storyState')
  	return c.redirect("/continue")
});


app.get("/continue", async (c) => {
	let storyChoice = c.req.query('storyChoice')
	let storyFile = Bun.file(import.meta.dir + '/stories/' + storyChoice)
	
	let story = new Story(await storyFile.text())
	let storyState = getCookie(c, `${storyChoice}_storyState`)
	console.log('storyState', JSON.stringify(storyState, null, '\t'))

	if (storyState) {
		story.state.LoadJson(storyState)
	}

  	if (!story.canContinue && story.currentChoices.length === 0){
   		return c.json({ status: "The End" })
	}

	let userChoice = c.req.query('choice')

  	if (userChoice) {
		console.log(userChoice);
    try {
    	story.ChooseChoiceIndex(parseInt(userChoice) - 1)
    } catch (e) {
    	c.status(400)
		return c.json({ status: "error", message: e.message })
    }
  }

  	let paragraphs = []
  	while (story.canContinue) {
    	let p = story.Continue();
    	console.log(p);
    	paragraphs.push(p);
  	}

  	let choices = []
  	if (story.currentChoices.length > 0) {
    	for (var i = 0; i < story.currentChoices.length; ++i) {
      		var choice = story.currentChoices[i]
      		console.log(i + 1 + ". " + choice.text)
      		choices.push({ choice: i + 1, label: choice.text })
    	}
  	}

	const saveString = story.state.ToJson()
	console.log('saveString', saveString)

  	setCookie(c, `${storyChoice}_storyState`, saveString)

  	return c.render({
    	status: "continued",
    	paragraphs: paragraphs,
    	choices: choices,
		storyChoice
  	})
})

export default app
