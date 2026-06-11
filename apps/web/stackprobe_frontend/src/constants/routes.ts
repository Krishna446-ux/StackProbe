export const ROUTES = {
  LOGIN: '/login',
  SUBMIT: '/submit',
  REPOSITORIES: '/repositories',
  SETTINGS: '/settings',
  JOB_STATUS: '/jobs',    // /jobs/:id
  REPORT: '/reports',     // /reports/:id
} as const;

export const PROTECTED_PREFIXES = [
  ROUTES.SUBMIT,
  ROUTES.JOB_STATUS,
  ROUTES.REPORT,
  ROUTES.REPOSITORIES,
  ROUTES.SETTINGS,
] as const;

export function isProtectedRoute(path: string): boolean {
  return path === ROUTES.SUBMIT ||
    path.startsWith(ROUTES.JOB_STATUS + '/') ||
    path.startsWith(ROUTES.REPORT + '/') ||
    path === ROUTES.REPOSITORIES ||
    path === ROUTES.SETTINGS;
}
