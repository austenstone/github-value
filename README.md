GitHub Value is a free and open-source application designed to help measure the adoption, value, and impact of GitHub features.

[![Style](https://github.com/user-attachments/assets/09c494cd-fbdb-4b8e-9cb3-696371e9487a)](https://github.com/settings/appearance#gh-dark-mode-only)
[![Style](https://github.com/user-attachments/assets/aca22119-b996-4bd4-b215-63874cce91c1)](https://github.com/settings/appearance#gh-light-mode-only)

### Core Features

- GitHub Copilot usage analytics and metrics
- Developer engagement tracking
- Light/Dark theme support
- Responsive Material Design UI

------------

### Deployment

github-value will take you through setup the first time you run it. You can manually configure it by copying the [`.env.example`](./.env.example) file to `.env` and configure the environment variables.

#### Security Configuration

When deploying behind load balancers, reverse proxies, or CDNs, configure the `TRUST_PROXY` environment variable:

- **Development**: `TRUST_PROXY=false` (default)
- **Production behind single proxy**: `TRUST_PROXY=1` (recommended)
- **Production behind multiple proxies**: `TRUST_PROXY=2` (or number of hops)
- **High security**: `TRUST_PROXY=10.0.0.1,172.16.0.0/12` (specific IPs/ranges)

This ensures accurate rate limiting and IP detection while maintaining security.

📖 **[Full Proxy Configuration Guide](./docs/PROXY_CONFIGURATION.md)**

<details>
  <summary>Docker Compose</summary>

  Install [docker compose](https://docs.docker.com/compose/install/) and run one command.

  ```bash
  docker-compose up
  ```
</details>

<details>
  <summary>Kubernetes</summary>

  @MattG57 has built a Kubernetes deployment for github-value. You can find it [here](https://github.com/MattG57/gvm-chart).

  If you want to deploy it to your own cluster, you can use the following command.
</details>

<details>
  <summary>Heroku</summary>

  You can deploy the application to [Heroku](https://www.heroku.com/) using the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#install-with-an-installer).

  <b>WARNING: Deploying to Heroku will cost you about $17/month.</b>

  Login, create a new app, and deploy the application.

  ```bash
  heroku login

  # If new app, create it
  heroku create your-app-name

  # Set stack to container
  heroku stack:set container -a your-app-name

  # Push and deploy
  git push heroku main

  # Check the logs
  heroku logs --tail

  # Check the status of the app
  heroku ps

  # Open the app in the browser
  heroku open
  ```

  The first time you visit the app it will walk you through creating the GitHub App in your organization.

  You will need to manually add the [config vars](https://devcenter.heroku.com/articles/config-vars) to the Heroku app. You can also edit config vars from your app’s `Settings` tab in the [Heroku Dashboard](https://dashboard.heroku.com/).
  
  ```bash
  # Set all config vars
  heroku config:set GITHUB_APP_ID="1234567"
  heroku config:set GITHUB_APP_INSTALLATION_ID="12345678"
  heroku config:set GITHUB_APP_PRIVATE_KEY="$(cat path/to/secret.key)"
  heroku config:set GITHUB_WEBHOOK_SECRET="secret"
  heroku config:set WEBHOOK_PROXY_URL="https://smee.io/123" # You can get this URL from your app after it starts
  heroku config:set BASE_URL="https://octodemo-9e26d32b64b8.herokuapp.com" # This is the URL of your Heroku app

  # Verify that the config vars are set correctly
  heroku config

  # Restart the app
  heroku restart -a app_name
  ```
</details>

------------

### MongoDB Setup

The docker compose file will automatically set up a MongoDB database for you.

If you want to use a different database, you can change the connection string in the `.env` file or via the environment variables.

```bash
MONGO_URI=mongodb://mongo:27017/github-value
```

------------

### GitHub App Setup

github-value will create the GitHub App for you the first time you run it. The app credentials are managed via the `.env` file or via the environment variables.

```bash
GITHUB_WEBHOOK_SECRET=
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY='-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----'
```

#### Required Permissions

Set permissions for the app as described in [github-manifest.json](./backend/github-manifest.json)

1. Repository Permisions
   1. Issues: Read and Write
   2. Pull requests: Read and Write
2. Organization Permissions
   1. Members: Read
   2. GitHub Copilot Business: Read
3. Subscribe to events
   1. Pull request
   2. Member (optional)
   3. Team (optional)
   4. Team add (optional)

<details>
  <summary>NEW Enterprise App</summary>

  If you have multiple organizations you'd like to monitor copilot usage for, you can now [create GitHub Apps for use within the Enterprise](https://github.blog/changelog/2024-10-22-enterprises-can-create-github-apps-for-use-within-the-enterprise/).

  1. [Registering a GitHub App](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/registering-a-github-app/registering-a-github-app#registering-a-github-app)
  2. Set permissions as described in [permissions](#required-permissions)
</details>

<details>
  <summary>Organization App</summary>
  You can create an organization app directly from github-value. On your first launch when you visit the website it will take you through setup. Simply click register and follow the instructions. You can also optionally use an existing app.
</details>

<details>
  <summary>Webhooks</summary>
  github-value uses webhooks to receive events from GitHub. We automatically create the webhook for you using [smee.io](https://smee.io/). You can also use your own webhook URL by setting the `WEBHOOK_PROXY_URL` environment variable or by changing the setting Webhook URL on the settings page.

  ```bash
  WEBHOOK_PROXY_URL=https://5950-2601-589-4885-e850-b1eb-a754-b856-6038.ngrok-free.app
  ```

  Ensure that the webhook URL is sending requests to the path `/api/github/webhooks`.

  Example: `https://5950-2601-589-4885-e850-b1eb-a754-b856-6038.ngrok-free.app/api/github/webhooks`

  ![image](https://github.com/user-attachments/assets/baed5eb7-4007-4881-bd99-53eba1636246)
</details>

------------

### Development

> [!TIP]
> This repository is Codespaces and DevContainers ready! Just open the repository in GitHub Codespaces or in Visual Studio Code and you're good to go! 🚀

Pre-requisites:

- [Docker and Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js 23+](https://nodejs.org/en) (for local development)
- [Angular CLI](https://angular.dev/tools/cli/setup-local#install-the-angular-cli) (`npm install -g @angular/cli`)

#### VSCode Task

You can start the **Develop** task by pressing `Ctrl+Shift+B` or running Run Task from the global Terminal menu.

![image](https://github.com/user-attachments/assets/7ae066e7-654b-4569-bacc-652edac1e0b1)

Right click the terminal sidebar and click **Unsplit terminal** if you're lacking space to view them side by side.

#### Manual

Start up the database. It's defined in the `docker-compose.yml` file.

```bash
docker-compose up -d mongo
```

Then, you can run the server and the client separately.

```bash
cd backend
cp .env.example .env  # Configure your env variables
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run start
```

Congratulations! You now have a fully functioning development environment! 🧑‍💻

### Contributing

Feel free to submit issues or pull requests! Contributions are welcome! 🤗

------------

### License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

