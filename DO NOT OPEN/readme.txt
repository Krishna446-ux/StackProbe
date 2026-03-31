React
	•	Just a UI library
	•	You build everything else yourself:
	•	routing
	•	API calls
	•	setup
vs NExt Js(react framework)
	•	Built on top of React
	•	Gives you:
	•	routing
	•	file structure
	•	optimization
	•	easy deployment
if i used react, then we had to write the api calls and routing seprately, my focus was on the backend

i did not chose Go, since the tasks to perform are not cpu intensive, but rather more focused on I/O, downloading files will take its sweet time

and with express(web framework in node js) i can easily intergrate with redis and bull mq

why typescript, it has type safety, better autocomplete, fewer runtime bugs, and this all plus on js

step 1 making clone repo using github rest api,(representation state transfer application programme) (architectural design for communicating between applcation over network)

an api endpoint is basically a url and http method through which request and responses are made

to clone repo or use github rest api, first understand difference between git and github

git is a version control system, it has branches,tracks changes, maintains history
where as github is just a place for keeping git repositories remotely 

along with api endpoints we are going to use octokit(for github rest api) to get meta data about repo
using simple git, to clone the repo
like 
1.await octokit.rest.repos.get(...)
	•	stars ⭐
	•	forks
	•	watchers
	•	description
Contributors & acitvity
2.await octokit.rest.repos.listContributors(...)
	•	who worked on it
	•	contribution distribution

Useful for:
“Is this project active or dead?”

3.Commit history (clean & structured)
await octokit.rest.repos.listCommits(...)
	•	recent activity
	•	commit frequency
4.Issues and PRs
await octokit.rest.issues.listForRepo(...)
	•	open issues
	•	closed issues
	•	PR discussions

👉 This is HUGE for StackProbe:

“Is this project well maintained?”

rember server is just a program that is running on a computer that lsitens for request and send resposnes, we basically use express here to create that proghram, it sits on ports,so if request come on those ports they are directed to our program

faced a bug of typescript not running, use npx tsc init for tsconfig.json, changed it with gpt prompt
the ran npx ts-node worker.ts
=> app.use(express.json());  forgot this it is body parser,now express reads raw requestn and cnverts JSON-> JS Object 
=> using get method, but request cannot be sent of get, should have used post
=> tried to use specific interface for req res objects given by express
=> had bug in the the folder location, it should not be present already, the name has to be different each time