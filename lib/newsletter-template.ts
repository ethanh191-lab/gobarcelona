export function getNewsletterTemplate(data: {
  events: any[];
  beer: any;
  tip: string;
  unsubscribeUrl: string;
}) {
  const { events, beer, tip, unsubscribeUrl } = data;

  const eventHtml = events.slice(0, 5).map(ev => `
    <div style="margin-bottom: 24px; padding: 16px; background: #f9f9f9; border-left: 4px solid #E63946;">
      <h3 style="margin: 0 0 8px; color: #1A1A2E;">${ev.title}</h3>
      <p style="margin: 0 0 8px; font-size: 14px; color: #666;">${new Date(ev.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })} @ ${ev.venue}</p>
      <p style="margin: 0; font-size: 14px;">${ev.description}</p>
      <a href="${ev.link}" style="display: inline-block; margin-top: 12px; color: #E63946; font-weight: bold; text-decoration: none;">View Detail →</a>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1A1A2E; color: #ffffff; padding: 40px 20px; text-align: center; }
        .logo { font-size: 32px; font-weight: 900; letter-spacing: -1px; }
        .logo .go { color: #E63946; }
        .section { margin: 40px 0; }
        .section-title { font-size: 20px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #E63946; padding-bottom: 8px; margin-bottom: 24px; color: #1A1A2E; }
        .beer-card { background: #1A1A2E; color: #ffffff; padding: 24px; border-radius: 8px; }
        .footer { font-size: 12px; color: #999; text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; }
        .btn { background: #E63946; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo"><span class="go">go</span>barcelona</div>
        <p style="margin-top: 12px; opacity: 0.8;">The Sunday Briefing</p>
      </div>
      <div class="container">
        <div class="section">
          <h2 class="section-title">Top 5 Events This Week</h2>
          ${eventHtml}
        </div>

        <div class="section">
          <h2 class="section-title">Cheap Beer Spotlight</h2>
          <div class="beer-card">
            <h3 style="margin: 0 0 8px; color: #E63946;">${beer.name}</h3>
            <p style="margin: 0 0 16px; opacity: 0.9;">${beer.address}</p>
            <div style="font-size: 24px; font-weight: 900;">${beer.beerPrice} <span style="font-size: 14px; font-weight: normal; opacity: 0.7;">(0.5L)</span></div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Practical Tip</h2>
          <p style="font-style: italic; background: #fff8f8; padding: 16px; border-radius: 8px;">"${tip}"</p>
        </div>

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} GoBarcelona.es</p>
          <p>You received this because you subscribed to our Sunday Briefing.</p>
          <p><a href="${unsubscribeUrl}" style="color: #E63946;">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}
