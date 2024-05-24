---
title: Documentation
---


PILOS has three main types of documentation: Administration, Development, and User. The documentation is written in Markdown and React, using Docusaurus, and can be found in the `docs` directory.

Starting from version 4, the documentation is available online at [https://thm-health.github.io/PILOS/](https://thm-health.github.io/PILOS/). Documentation for older versions can be found in the `docs` directory of the corresponding branch.

## Deployment

The documentation is automatically generated and deployed to GitHub Pages using GitHub Actions. This process occurs on every push to the `develop` branch and also rebuilds the documentation for older supported versions. Maintainers can also manually trigger the workflow to rebuild the documentation.

## Running the Documentation Locally

To run the documentation locally, follow these steps:

1. **Install Dependencies:**
   ```bash
   ./sail npm run docs:install
   ```

2. **Start the Development Server:**
   ```bash
   ./sail npm run docs:dev
   ```
