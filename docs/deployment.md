# Deployment

## GitHub Pages

In the repository, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source.

The included workflow installs the locked dependencies, runs the behavior tests and builds the app with `/noematrace/` as its base path. It uploads `dist/` and publishes it through GitHub Pages.

After a successful deployment:

- Workspace: https://robertvaganian.github.io/noematrace/
- Case study: https://robertvaganian.github.io/noematrace/case-study/

To reproduce the Pages build locally:

```sh
npm ci
npm test
npm run build:pages
npm run preview
```

Open the preview at `/noematrace/`. The build includes a `case-study/index.html` entry for direct navigation and a `404.html` fallback.

## Domain root

```sh
npm run build
```

Publish the contents of `dist/`. The workspace is at `/` and the case study at `/case-study/`.

Changing the repository name requires updating the base path in `build:pages` and the URLs in the README and this guide.
