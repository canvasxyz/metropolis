# Metropolis

Metropolis is an extended version of the Polis collective-response
tool. So far, we have implemented:

- A unified React frontend using hooks, replacing three separate
  frontends in the original version of Polis.
- A simpler response interface which supports all functionality
  present in the original interface.

In the near future, we expect to implement:

- A new machine learning and AI analysis toolchain.
- Open data, where all Polis interactions are signed by either
  a custodial or non-custodial keypair.
- Support for multiple authenticated-data standards, SSO providers,
  and decentralized identity providers.

### Setup

Setting up dependencies:

We recommend installing [nvm](https://github.com/creationix/nvm) so
that you can easily switch between your favorite flavors of node.

* Node `>= 16`
* NPM `>= 8`

If using nvm, run the commands below to install node and the application dependencies.

```sh
nvm install 18
nvm use 18
npm install
```

Setting up locally:

1. Install Postgres, through Postgres.app (Mac) or your package manager. Also install Java and Clojure for the math worker.

```
brew install --cask temurin
brew install clojure/tools/clojure
```

2. From a `psql` console run:

```
create database "polis-dev";
create user "polis-dev";
alter role "polis-dev" superuser;
```

3. Run migrations ([️see also](docs/migrations.md))

```
psql -d polis-dev -f postgres/migrations/000000_initial.sql
psql -d polis-dev -f postgres/migrations/000001_update_pwreset_table.sql
psql -d polis-dev -f postgres/migrations/000002_add_xid_constraint.sql
psql -d polis-dev -f postgres/migrations/000003_add_origin_permanent_cookie_columns.sql
psql -d polis-dev -f postgres/migrations/000004_drop_waitinglist_table.sql
psql -d polis-dev -f postgres/migrations/000005_drop_slack_stripe_canvas.sql
psql -d polis-dev -f postgres/migrations/000006_update_votes_rule.sql
psql -d polis-dev -f postgres/migrations/000007_add_new_columns.sql
psql -d polis-dev -f postgres/migrations/000008_add_encrypted_ip.sql
psql -d polis-dev -f postgres/migrations/000009_add_postsurvey_text_and_limit.sql
psql -d polis-dev -f postgres/migrations/000010_add_survey_caption_and_redirect.sql
psql -d polis-dev -f postgres/migrations/000011_add_postsurvey_submissions.sql
```

4. Setup environment variables:

```
cp example.env .env
cd server
cp example.env .env
```

5. Install dependencies and run. This will start the client on port 8080, server on port 8040, and run the math worker:

```
npm install
npm run dev
```

6. Run all database migrations before starting:

```
cat server/postgres/migrations/* | psql polis-dev
```

7. Create user: http://localhost:8080/createuser

8. To run in production mode locally, use *npm run start*, and access the site at http://localhost:8040.

9. To run in production mode on Heroku, set up the Heroku CLI and then set up plugins:

```
heroku buildpacks:add heroku/clojure
heroku addons:create heroku-postgresql:mini
heroku addons:create sendgrid:starter
heroku config:set MATH_ENV=prod
heroku config:set NODE_OPTIONS="--max_old_space_size=2560"
heroku config:set SENDGRID_API_KEY=[your sendgrid api key]
heroku config:set POLIS_FROM_ADDRESS="Admin <name@email.com>"
heroku config:set DOMAIN_OVERRIDE=[your domain]
heroku config:set EMBED_SERVICE_HOSTNAME=[your domain]
heroku config:set ENCRYPTION_PASSWORD_00001=[a new password]
git push heroku main
```

To send password reset emails, configure Sendgrid with a single sender identity
from within the Sendgrid control panel. Then, set that email address and the
Sendgrid API key in `server/.env`.

10. To run all migrations on production, or to run one specific migration:

```
cat server/postgres/migrations/* | heroku psql
cat server/postgres/migrations/000000_initial.sql | heroku psql
```

11. You may wish to set a custom domain name and Heroku SSL on
production. This can be done in the Heroku control panel.

12. To analyze bundle size:
- `cd client`
- `npx webpack --profile --json > stats.json`
- `npx webpack-bundle-analyzer ./stats.json`

### Facebook Integration (Untested)

Optionally, you can [register with
Facebook](https://developers.facebook.com/docs/development) and get a
Facebook App ID to use the Facebook auth features. If you do so, set
the FB_APP_ID environment variable in the top level `.env` file, or
manually pass it in when building and running this application.

### Twitter Integration (Untested)

To enable twitter widgets for user authentication, set the
ENABLE_TWITTER_WIDGETS environment variable to `true` in the top level
`.env` file, or manually pass it in when building and running.

### Terminology

- uid: User ID
- xid: External ID (for a user)
- pid: Participant ID (specific to a conversation)
- zid: Conversation ID
- tid: Statement ID
- bid: Base Cluster ID

### Troubleshooting

In case a server isn't starting on the right port, check your
currently running processes (`ps`) and make sure those ports
aren't taken by other services.

### Acknowledgements

This platform is based on the Polis platform developed by the
Computational Democracy Project. For the Polis codebase, see
[Github](https://github.com/compdemocracy/polis). For a Polis
methods paper, see [Polis: Scaling Deliberation by Mapping High
Dimensional Opinion
Spaces](https://www.e-revistes.uji.es/index.php/recerca/article/view/5516/6558).

(c) 2012-present, authors, under [AGPLv3 with additional permission under section 7](/LICENSE)
