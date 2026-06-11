import { useState, useEffect } from 'react';
//login page simple redirects to github/auth
import LoginPage from './pages/LoginPage';
import { AppLayout } from './layout/AppLayout';
import { Sidebar } from './layout/Sidebar';
import { AppRouter } from './routes/AppRouter';
import { useAuth } from './hooks/useAuth';
import { useJobPolling } from './hooks/useJobPolling';
import { getAnalyzedRepos, submitRepo } from './api/repos.api';
import type { AnalyzedRepo } from './types/dashboard.types';

function App() {
  const {
    authenticated,
    loadingAuth,
    authMessage,
    handleLogout,
    navigate,
    currentPath,
  } = useAuth();

  // Repository list state
  /*
  export interface AnalyzedRepo {
  repo_id: string;
  owner: string;
  name: string;
  report_id: string;
  quality_score: number;
  security_score: number;
  analysis_date: string;
}
  */
  const [repos, setRepos] = useState<AnalyzedRepo[]>([]);

  // Submit form state
  const [repoUrl, setRepoUrl] = useState('');
  const [force, setForce] = useState(false);

  // Active Job Tracking
  const [activeJobId, setActiveJobId] = useState('');

  // Clear stale activeJobId when user navigates away from /jobs/ route.
  // Without this, activeJobId remains populated after completion, causing
  // pollingJobId to stay truthy and the submit button to stay disabled.
  useEffect(() => {
    if (activeJobId && !currentPath.startsWith('/jobs/')) {
      setActiveJobId('');
    }
  }, [currentPath, activeJobId]);

  // Extract route job ID for polling
  const routeJobId = currentPath.startsWith('/jobs/')
    ? currentPath.split('/')[2]
    : '';

  const pollingJobId = activeJobId || routeJobId;

  // Fetch analyzed repos when authenticated
  const refreshRepos = () => {
    if (!authenticated) return;
    getAnalyzedRepos()
      .then((data) => setRepos(data))
      .catch((err) => console.error('Failed to fetch repositories', err));
  };

  const { status, pollingError, setPollingError } = useJobPolling({
    jobId: pollingJobId,
    authenticated,
    navigate,
    onComplete: refreshRepos,
  });
  //Run on mount, and then again whenever any dependency changes.
  useEffect(() => {
    refreshRepos();
  }, [authenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Submit repo URL for analysis
  const sendRepoUrl = async (): Promise<void> => {
    if (!repoUrl.trim()) return;
    setPollingError('');
    try {
      const data = await submitRepo({ repoUrl: repoUrl.trim(), force });
      setActiveJobId(data.job_id);
      navigate(`/jobs/${data.job_id}`);
    } catch (err: any) {
      console.error('Error sending repo url', err);
      setPollingError(err.message || 'Failed to trigger repo analysis.');
    }
  };

  /**
   * Re-analyze: directly submits a fresh scan without going through the form.
   * Called by ReportPage's Re-run Analysis button.
   */
  const handleReanalyzeRepo = async (owner: string, name: string): Promise<void> => {

    const url = `https://github.com/${owner}/${name}`;
    setPollingError('');
    try {
      const data = await submitRepo({ repoUrl: url, force: true });
      setActiveJobId(data.job_id);
      navigate(`/jobs/${data.job_id}`);
    } catch (err: any) {
      console.error('Re-analyze failed', err);
      setPollingError(err.message || 'Failed to trigger re-analysis.');
    }
  };

  /* ─── Global loading spinner ──────────────────────────── */
  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0f] text-white">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-green-500 mx-auto" />
          <p className="text-xs text-zinc-500">Validating session...</p>
        </div>
      </div>
    );
  }

  /* ─── Unauthenticated ─────────────────────────────────── */
  if (currentPath === '/login' || !authenticated) {
    return <LoginPage message={authMessage} />;
  }

  /* ─── Authenticated app ───────────────────────────────── */
  const st = (status || '').toUpperCase();
  const isScanning = !!pollingJobId && st !== 'COMPLETE' && st !== 'FAILED';

  return (
    <AppLayout
      currentPath={currentPath}
      onLogout={handleLogout}
      disabled={isScanning}
      sidebar={<Sidebar currentPath={currentPath} navigate={navigate} disabled={isScanning} />}
    >
      <AppRouter
        currentPath={currentPath}
        navigate={navigate}
        authenticated={authenticated}
        repos={repos}
        status={status}
        pollingError={pollingError}
        repoUrl={repoUrl}
        onRepoUrlChange={(url) => setRepoUrl(url)}
        force={force}
        onForceChange={setForce}
        onSubmit={sendRepoUrl}
        jobId={pollingJobId}
        onReanalyze={handleReanalyzeRepo}
      />
    </AppLayout>
  );
}

export default App;
