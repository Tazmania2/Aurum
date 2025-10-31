# Cycling Dashboard

An automatic cycling dashboard that rotates between a Business Intelligence report and three different widget layout configurations.

## Features

- **View 1**: Looker Studio BI Report (embedded iframe)
- **View 2**: Widget 1 (Vendedores) large, Widgets 2 & 3 small
- **View 3**: Widget 2 (Referidos) large, Widgets 1 & 3 small
- **View 4**: Widget 3 (SDR) large, Widgets 1 & 2 small

The dashboard automatically cycles through all views every 10 seconds.

## Technologies

- HTML5
- CSS3 (Flexbox)
- Vanilla JavaScript
- jQuery (required by Funifier SDK)
- Funifier SDK for gamification widgets

## Deployment

### Local Testing

Simply open `index.html` in a web browser:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Or just open the file directly
open index.html
```

### Vercel Deployment

This project is configured for Vercel deployment:

1. Push to GitHub
2. Import the repository in Vercel
3. Deploy (no build configuration needed)

### GitHub Setup

```bash
git init
git add .
git commit -m "Initial commit: Cycling dashboard"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection (for external dependencies and BI report)

## Configuration

The application uses the following Funifier configuration:
- API Key: `69027af6e179d46fce283e7e`
- Service URL: `https://service2.funifier.com`
- Widgets: `espacial`, `corrida_espacial__referidos`, `corrida_espacial__sdr`

## License

Proprietary
