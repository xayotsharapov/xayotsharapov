const BOT_RE =
  /bot|crawl|spider|slurp|archiver|facebookexternalhit|facebookcatalog|meta-externalagent|embedly|quora link preview|whatsapp|telegram|skype|discord|slack|vkshare|bingpreview|lighthouse|pagespeed|gtmetrix|pingdom|uptime|headless|phantomjs|selenium|puppeteer|playwright|python|curl|wget|httpclient|axios|node-fetch|undici|go-http|java\/|okhttp|libwww|scrapy|feed|rss|preview/i;

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.length < 20) return true;
  return BOT_RE.test(userAgent);
}
