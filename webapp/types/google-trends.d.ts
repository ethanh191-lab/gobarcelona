declare module 'google-trends-api' {
  export function dailyTrends(options: { geo: string }): Promise<string>;
}
