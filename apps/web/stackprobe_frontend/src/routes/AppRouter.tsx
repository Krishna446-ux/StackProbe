import React from 'react';
import { SubmitPage } from '../pages/SubmitPage';
import { JobStatusPage } from '../pages/JobStatusPage';
import { RepositoriesPage } from '../pages/RepositoriesPage';
import { ReportPage } from '../pages/ReportPage';
import { SettingsPage } from '../pages/SettingsPage';
import type { AnalyzedRepo } from '../types/dashboard.types';

interface AppRouterProps {
  currentPath: string;
  navigate: (path: string) => void;
  authenticated: boolean;
  repos: AnalyzedRepo[];
  // Job polling state
  status: string;
  pollingError: string;
  // Submit form props (forwarded to SubmitPage)
  repoUrl: string;
  onRepoUrlChange: (url: string) => void;
  force: boolean;
  onForceChange: (checked: boolean) => void;
  onSubmit: () => void;
  jobId: string;
  // Re-analyze callback (forwarded to ReportPage)
  onReanalyze: (owner: string, name: string) => Promise<void>;
}

export const AppRouter: React.FC<AppRouterProps> = ({
  currentPath,
  navigate,
  authenticated,
  repos,
  status,
  pollingError,
  repoUrl,
  onRepoUrlChange,
  force,
  onForceChange,
  onSubmit,
  jobId,
  onReanalyze,
}) => {
  const pathParts = currentPath.split('/');
  const routeJobId = currentPath.startsWith('/jobs/') ? pathParts[2] : '';
  const routeReportId = currentPath.startsWith('/reports/') ? pathParts[2] : '';

  // 1. /submit — dashboard with form
  if (currentPath === '/submit') {
    return (
      <SubmitPage
        navigate={navigate}
        repos={repos}
        repoUrl={repoUrl}
        onRepoUrlChange={onRepoUrlChange}
        force={force}
        onForceChange={onForceChange}
        onSubmit={onSubmit}
        jobId={jobId}
        pollingError={pollingError}
      />
    );
  }

  // 2. /jobs/:id
  if (currentPath.startsWith('/jobs/')) {
    return (
      <JobStatusPage
        routeJobId={routeJobId}
        status={status}
        pollingError={pollingError}
        navigate={navigate}
      />
    );
  }

  // 2.5. /settings
  if (currentPath === '/settings') {
    return <SettingsPage />;
  }

  // 3. /repositories
  if (currentPath === '/repositories') {
    return <RepositoriesPage repos={repos} navigate={navigate} />;
  }

  // 4. /reports/:id
  if (currentPath.startsWith('/reports/')) {
    return (
      <ReportPage
        reportId={routeReportId}
        repos={repos}
        authenticated={authenticated}
        navigate={navigate}
        onReanalyze={onReanalyze}
      />
    );
  }

  // Default
  return (
    <SubmitPage
      navigate={navigate}
      repos={repos}
      repoUrl={repoUrl}
      onRepoUrlChange={onRepoUrlChange}
      force={force}
      onForceChange={onForceChange}
      onSubmit={onSubmit}
      jobId={jobId}
      pollingError={pollingError}
    />
  );
};
