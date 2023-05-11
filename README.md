# Polis

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

1. Install Postgres, through Postgres.app (Mac) or your package manager.
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
```

4. Setup environment variables:

```
cp example.env .env
cd server
cp example.env .env
```

5. Install dependencies and run:

```
npm install
npm run dev
```

6. Create user: http://localhost:8080/createuser

7. Set up maildev. Runs on port 1080, with SMTP on port 1025:

```
$ docker pull maildev/maildev:1.1.1
$ docker run -p 1080:1080 -p 1025:1025 maildev/maildev
```

[️Production configuration](docs/configuration.md):
- Set up the domain name you'll be serving from
- Enable and add API keys for 3rd party services (e.g. automatic comment translation, spam filtering, etc)
- [🔏 Set up SSL/HTTPS](docs/ssl.md), to keep the site secure
- [📈 Scale](docs/scaling.md) for large or many concurrent conversations

### Facebook App Integration

Optionally, you can [register with Facebook](https://developers.facebook.com/docs/development) and get a Facebook App ID
to use the Facebook auth features.

If you do so, set the FB_APP_ID environment variable in the top level `.env` file, or manually pass it in
when building and running this application.

### Twitter Integration

To enable twitter widgets for user authentication, set the ENABLE_TWITTER_WIDGETS environment variable to `true` in the
top level `.env` file, or manually pass it in when building and running this application.

### Acknowledgements

This platform is substantively based on the Polis platform developed by the Computational Democracy Project.
For the Polis codebase, see [Github](https://github.com/compdemocracy/polis).

For a detailed methods paper, see [Polis: Scaling Deliberation by
Mapping High Dimensional Opinion
Spaces](https://www.e-revistes.uji.es/index.php/recerca/article/view/5516/6558).

(c) 2012-present, authors, under [AGPLv3 with additional permission under section 7](/LICENSE)
