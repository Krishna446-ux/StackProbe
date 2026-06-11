import { useState, useEffect } from 'react';
import { getJob } from '../api/jobs.api';
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

export function useJobPolling({ jobId, authenticated, navigate, onComplete }: UseJobPollingOptions): UseJobPollingReturn {
  const [status, setStatus] = useState('');
  const [pollingError, setPollingError] = useState('');

  useEffect(() => {
    if (!jobId || !authenticated) return;

    setStatus('PENDING');
    setPollingError('');
    //interval size is of 3 seconds
    const interval = setInterval(async () => {
      try {
        const data = await getJob(jobId);
        let currentStatus = data.status;

        if (currentStatus === 'RUNNING' || currentStatus === 'PENDING') {
          try {
            // Worker might have crashed after creating report. Check if report exists.
            const reportData = await getReport(jobId);
            if (reportData && reportData.report_id) {
              currentStatus = 'COMPLETE';
              data.status = 'COMPLETE';
            }
          } catch (e: any) {
            // Report not ready yet
            console.log(e?.message ?? "");
            console.log("Something wrong while polling and getting reports to check if complete or not, in case worker crashed");

          }
        }

        setStatus(currentStatus);

        if (currentStatus === 'COMPLETE' || currentStatus === 'FAILED') {
          clearInterval(interval);

          if (currentStatus === 'COMPLETE') {
            const reportData = await getReport(jobId);
            if (reportData && reportData.report_id) {
              navigate(`/reports/${reportData.report_id}`);
              onComplete?.();
            }
            else {
              navigate('/repositories');

            }
          } else {
            setPollingError(data?.failure_reason || data?.faliure_reason || 'Pipeline execution crashed.');
            //navigate('/repositories');
          }
        }
      } catch (err) {
        console.error('Error happened during polling', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, authenticated, navigate, onComplete]);

  return { status, pollingError, setPollingError };
}
