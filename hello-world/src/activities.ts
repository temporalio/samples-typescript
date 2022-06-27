// @@@SNIPSTART typescript-hello-activity
export async function greet(name: string): Promise<string> {
  return `Hello, ${name}!`;
}
// @@@SNIPEND

export async function refreshAccessTokenLocalActivity(): Promise<any> {
  console.log('refreshAccessTokenLocalActivity');
  //This activity makes an http request so it can fetch an access token using the refreshToken
  return new Promise((resolve) => setTimeout(() => resolve({ token: 'token-foo', status: 'configured' }), 5000));
}
