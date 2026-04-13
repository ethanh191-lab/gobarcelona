# GoBarcelona Platform

Professional, automated city guide for international residents in Barcelona. Created with a 'NOS Stories' editorial aesthetic (speed, bold typography, no fluff).

## Project Structure

- `webapp/`: Next.js 14 application (Core platform)
- `.gitignore`: Production-standard exclusions for Node, Next, and OS artifacts.

## Key Features

- **Beer Map (Pro)**: High-precision Google Maps integration with price-coded pins (Carrer de la Llibreteria 21 spawn point).
- **BCN Pulse**: Real-time aggregated event feed and news ticker.
- **Multilingual Support**: Real-time translation (Google Translate API) for headlines, and localized UI for EN, ES, NL, FR, CA, DE.
- **NOS Stories Aesthetics**: Dark-mode editorial theme with heavy Barlow Condensed typography.

## Development

```bash
cd webapp
npm install
npm run dev
```

## Deployment

The platform is configured for automatic synchronization with **GitHub** and **Vercel** via the `main` branch.
