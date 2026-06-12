import { useState, useEffect, useRef } from 'react';
import { getJob } from '../api/jobs.api';
import { getWorkerHealth } from '../api/jobs.api';
import { getReport } from '../api/reports.api';

interface UseJobPollingOptions {
  jobId: string;
  authenticated: boolean;
  navigate: (path: string) => void;
  /** Called after a COMPLETE job navigates to the report page. Use to refresh repos list. */
  onComplete?: () => void;
}

interface UseJobPollingReturn {
  status: string;
  pollingError: string;
  setPollingError: (err: string) => void;
}

/** How often (in ms) to poll job status. */
const JOB_POLL_INTERVAL_MS = 3000;

/** Check worker health every N job-poll ticks (i.e. every 15 s at 3 s intervals). */
// ticks here means number of polls, so check for worker heart beat every 5th poll
const HEALTH_CHECK_EVERY_N_TICKS = 5;

export function useJobPolling({ jobId, authenticated, navigate, onComplete }: UseJobPollingOptions): UseJobPollingReturn {
  const [status, setStatus] = useState('');
  const [pollingError, setPollingError] = useState('');

  // Track tick count in a ref so the interval closure always reads the latest value
  // useRef is basically creates variable that holds value that won't change on re renders
  const tickRef = useRef(0);

  useEffect(() => {
    if (!jobId || !authenticated) return;

    setStatus('PENDING');
    setPollingError('');
    tickRef.current = 0;

    const interval = setInterval(async () => {
      try {
        // ── 1. Source of truth: backend job status ──────────────────────────
        const data = await getJob(jobId);
        const currentStatus = data.status;

        // ── 2. Periodic worker health check (only while job is still active) ─
        if (currentStatus === 'RUNNING' || currentStatus === 'PENDING') {
          tickRef.current += 1;// count the poll
          // this modulo reaching zero means its the 5th poll
          if (tickRef.current % HEALTH_CHECK_EVERY_N_TICKS === 0) {
            try {
              const health = await getWorkerHealth();
              if (!(health.status === "ONLINE")) {
                // Worker is down — stop polling, surface an error.
                clearInterval(interval);
                setStatus(currentStatus);
                setPollingError(
                  'The analysis worker is currently unavailable. ' +
                  'Please try again later or contact support if the problem persists.'
                );
                return;
              }
            } catch {
              // Health endpoint itself failed — treat worker as unavailable.
              clearInterval(interval);
              setStatus(currentStatus);
              setPollingError(
                'Unable to reach the worker health service. ' +
                'The worker may be down. Please try again later.'
              );
              return;
            }
          }
        }

        // ── 3. Update UI status ─────────────────────────────────────────────
        setStatus(currentStatus);

        // ── 4. Terminal states ──────────────────────────────────────────────
        if (currentStatus === 'COMPLETE' || currentStatus === 'FAILED') {
          clearInterval(interval);

          if (currentStatus === 'COMPLETE') {
            // Navigate to the report if one exists, otherwise fall back to repos.
            try {
              const reportData = await getReport(jobId);
              if (reportData && reportData.report_id) {
                navigate(`/reports/${reportData.report_id}`);
                onComplete?.();
              } else {
                navigate('/repositories');
              }
            } catch {
              navigate('/repositories');
            }
          } else {
            // FAILED
            setPollingError(
              data?.failure_reason ||
              'Pipeline execution crashed.'
            );
          }
        }
      } catch (err) {
        console.error('Error during job polling:', err);
      }
    }, JOB_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [jobId, authenticated, navigate, onComplete]);

  return { status, pollingError, setPollingError };
}
