import { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage';
//import Spinner from './components/Spinner';
import './App.css'
import type { authenticateMe_interface } from './interfaces/authenticateMe';
import type { JobInterface } from './interfaces/jobInterface';
import type { repo_link_interface } from './interfaces/repoLink';
function App() {
  const [repo_url, setRepoUrl] = useState("");
  const [force, setForce] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");
  const [report, setReport] = useState({
  });
  // "quality_score": 0,
  // "security_score": 0,
  // "ai_summary": ""
  //const [faliure_reason, setFaliureReason] = useState("");
  //const [loading, setLoading] = useState(false);
  //async function returns a promise, useEffect function expects a either function(cleanup) or nothing is returned, So 
  // before the components render, we are checking if this user has a valid jwt cookie or not,
  // on the backend on this api we check simply wh ether this jwt cookies is correct or not
  useEffect(() => {
    const authenticateMe = async (): Promise<void> => {
      try {
        const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/auth/me", {
          credentials: 'include'
        })
        const data: authenticateMe_interface = await response.json();
        setAuthenticated(data.authenticated as boolean)
      }
      catch (err: unknown) {
        console.log(err);
      }
    }
    authenticateMe();
  }, []);
  //useEffect here created for jobId, when we obtain the jobId, that basically means. now a job is created 
  //we are going to use polling from here on, asking in intervals again and again if the job is completed or not
  //POLLING
  useEffect(() => {
    //FAILED COMPLETE
    if (!jobId) return
    const interval = setInterval(async () => {
      try {
        console.log(jobId)
        let response = await fetch(import.meta.env.VITE_BACKEND_URL + `/jobs/${jobId}`, {
          credentials: 'include'
        })
        let data: JobInterface = await response.json();
        setStatus(data.status);
        //setStatus is an asynchronus function, so trying to use status won't work 
        const currentStatus = data.status;
        setStatus(currentStatus);
        if (currentStatus === "COMPLETE" || currentStatus === "FAILED") {
          // now decide on the report
          if (status === 'COMPLETE') {
            try {
              response = await fetch(import.meta.env.VITE_BACKEND_URL + `/reports/${jobId}`, {
                credentials: 'include'
              })
              data = await response.json();
              console.log(data)
              setReport(data);
            }
            catch (err: any) {
              console.log("Report could not be fetched", err)
            }
          }
          clearInterval(interval);
        }
      }
      catch (err: unknown) {
        console.log("Error happened during polling", err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [jobId])

  //this function sends the repo url to the backend, job will be created
  async function sendRepoUrl(): Promise<void> {
    const reqBody: repo_link_interface = {
      "repoUrl": repo_url,
      "force": force
    }
    try {
      const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/repos", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
      })
      const data: JobInterface = await response.json();
      setJobId(data.job_id);
      setStatus(data.status);
      console.log(data);
    }
    catch (err: unknown) {
      console.log("Error happened while sending repo url", err);
    }
  }

  function handleRepoUrlChange(event: unknown) {
    setRepoUrl(event.target.value);
    console.log(repo_url);
  }
  if (!authenticated) {
    return <LoginPage />
  }
  else {
    return <>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-6">

          {/* Header and Input Section */}
          <div className="space-y-2">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-200">Repository Analyzer</h1>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter GitHub repository URL..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                onChange={handleRepoUrlChange}
              />
              <button
                onClick={sendRepoUrl}
                className="bg-zinc-100 hover:bg-zinc-200 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Submit
              </button>
            </div>
          </div>

          {/* Options / Configuration */}
          <div className="flex items-center gap-3 bg-zinc-950/50 border border-zinc-850 p-3 rounded-lg">
            <input
              type="checkbox"
              id="force-checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-zinc-100 accent-zinc-100 cursor-pointer"
            />
            <label htmlFor="force-checkbox" className="text-xs text-zinc-400 cursor-pointer select-none font-medium">
              Force re-analyze pipeline execution
            </label>
          </div>

          {/* Status Tracker */}
          <div className="border-t border-zinc-800 pt-4 flex items-center justify-between text-sm">
            <span className="text-zinc-500 font-medium">Pipeline Status</span>
            <span className={`font-mono text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold
            ${status === 'COMPLETE' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50' :
                status === 'FAILED' ? 'bg-red-950/50 text-red-400 border border-red-900/50' :
                  status === 'RUNNING' ? 'bg-amber-950/50 text-amber-400 border border-amber-900/50 animate-pulse' :
                    'bg-zinc-850 text-zinc-400'}`}
            >
              {status || 'IDLE'}
            </span>
          </div>

          {/* Report Evaluation Cards */}
          {report && (
            <div className="border-t border-zinc-800 pt-4 space-y-4">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Analysis Metrics</h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg text-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Quality Score</span>
                  <span className="text-2xl font-mono font-bold text-zinc-200">{report.quality_score}</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg text-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Security Score</span>
                  <span className="text-2xl font-mono font-bold text-zinc-200">{report.security_score}</span>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">AI Executive Summary</span>
                <p className="text-sm text-zinc-400 leading-relaxed italic">
                  "{report.ai_summary}"
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  }
}


export default App
