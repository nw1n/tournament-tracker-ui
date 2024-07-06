# Tournament Tracker Frontend

This tournament tracker app is designed for running a game tournament. It was orignally built for MTG tournaments, but can be used for any kind of tournament with 1v1 games. It can be used as a PWA or directly in the browser.

This repo is the frontend repo of the Tournament Tracker app.

Live hosted here:

[https://tournament-tracker-frontend.pages.dev/](https://tournament-tracker-frontend.pages.dev/)

The basic app works without any configuration or connection to a server.

To use the extended features of the app the settings have to be set in the App's User Interface: Under "Settings" set "Server Url" and "Password".  
Extended features are: Server based List of predefined players and server storage of tournament data.

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev
```

## Production

Build the application for production:

```bash
# npm
npm run generate
```
