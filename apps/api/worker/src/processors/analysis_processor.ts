//start from here writing the worker function, watch the video of chai aur code for finding what are queue events
import logger from '../lib/logger.js'

//use logger instead of console.log for logging stuff 
//processorFunction

/* This is job, inside the queue
    {
        "repo_id": details.repo_id,
        "repo_url": repoUrl
    }
*/
const processorFunction = async (job: any) => {
    //make a services folder and create a function to update the repo based on the id given, 

}
export default processorFunction;
// * update DB
// * fake processing
// * create report
// * mark COMPLETE