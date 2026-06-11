# Smoke, Steam and Survival

A browser-based educational choose-your-own-adventure game for Year 8 History students learning about the Industrial Revolution.

Students choose a role, make decisions, collect evidence, check glossary terms and finish by writing a reflection:

> Was the Industrial Revolution mainly positive, mainly negative, or mixed?

## Features

- React, TypeScript, Vite and Tailwind CSS
- Single-page browser app
- Responsive layout for school Chromebooks
- Five playable roles
- Stats for Money, Health, Skills, Reputation and Reform
- Evidence notebook
- Glossary modal
- Final reflection screen with copy-to-clipboard
- Restart button
- Automatic localStorage save/load
- No login and no external database

## Teacher Editing

The story content is split into role pathway files in:

```text
src/data/
```

The app loads these files and combines all scenes into one scene map by ID:

- `factory_child.json`
- `rural_child.json`
- `engineer.json`
- `owner_child.json`
- `reformer.json`
- `shared.json`

Each scene uses this structure:

- `id`: unique scene ID
- `role`: role pathway or `shared`
- `title`: scene heading
- `text`: story text
- `historyNote`: historical context
- `glossaryTerms`: terms shown in the glossary panel
- `evidence`: notebook evidence gained
- `choices`: student choices

Each scene choice has:

- `label`: button text shown to the student
- `next`: the ID of the next scene
- `effects`: changes to Money, Health, Skills, Reputation and Reform

Keep every normal scene to three choices so the classroom interface stays consistent. Ending scenes should use `"choices": []`.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL Vite prints in the terminal, usually:

```text
http://localhost:5173
```

Build the production version:

```bash
npm run build
```

Preview the built app:

```bash
npm run preview
```

## Deploy to GitHub Pages

This project uses `base: "./"` in `vite.config.js`, which works well for GitHub Pages project sites.

One simple deployment method:

1. Create a GitHub repository for the project.
2. Push the project files to the repository.
3. In GitHub, open the repository settings.
4. Go to **Pages**.
5. Set the source to **GitHub Actions**.
6. Add a Vite GitHub Pages workflow, or use a Pages action that builds with `npm run build` and publishes the `dist` folder.

Example workflow file path:

```text
.github/workflows/deploy.yml
```

Example workflow:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

After the action completes, GitHub Pages will show the public site URL in the repository's **Pages** settings.
