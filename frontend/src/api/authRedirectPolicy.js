export function shouldForceLoginRedirect({
  status,
  requestUrl = '',
  currentPath = ''
}) {
  if (status !== 401) {
    return false
  }

  const normalizedUrl = requestUrl.toLowerCase()
  const isLoginRequest = normalizedUrl.includes('/auth/login')
  const isLoginPage = currentPath.startsWith('/login')

  return !isLoginRequest && !isLoginPage
}
