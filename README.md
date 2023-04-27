# Polis

[![E2E Tests](https://github.com/compdemocracy/polis/workflows/E2E%20Tests/badge.svg)][e2e-tests]

- [ ] Remove FB_APP_ID
- [ ] Remove Twitter ID
- [ ] Remove GA_TRACKING_ID

Setting up locally:

1. Install Postgres, through Postgres.app (Mac) or your package manager.
2. Setup env:

```
cp example.env .env
cd server
cp example.env .env
```

3. npm install everywhere
4. From a `psql` console run:

```
create database "polis-dev";
create user "polis-dev";
alter role "polis-dev" superuser;
```

5. Run migrations ([️see also](docs/migrations.md))

```
psql -d polis-dev -f postgres/migrations/000000_initial.sql
psql -d polis-dev -f postgres/migrations/000001_update_pwreset_table.sql
psql -d polis-dev -f postgres/migrations/000002_add_xid_constraint.sql
psql -d polis-dev -f postgres/migrations/000003_add_origin_permanent_cookie_columns.sql
psql -d polis-dev -f postgres/migrations/000004_drop_waitinglist_table.sql
psql -d polis-dev -f postgres/migrations/000005_drop_slack_stripe_canvas.sql
```

6. Start servers

7. Create user: http://localhost:8080/createuser

Theming: https://theme-ui.com/

8. Mail?

Run maildev on port 1080, with SMTP on port 1025:

```
$ docker pull maildev/maildev:1.1.1
$ docker run -p 1080:1080 -p 1025:1025 maildev/maildev
```

9. Testing?

BASEURL = https://127.0.0.1.sslip.io
GIT_HASH = $(shell git rev-parse --short HEAD)

10. Production config

[️Configure](docs/configuration.md), esp:
  - the domain name you'll be serving from
  - enable and add API keys for 3rd party services (e.g. automatic comment translation, spam filtering, etc)
- [🔏 Set up SSL/HTTPS](docs/ssl.md), to keep the site secure
- [📈 Scale](docs/scaling.md) for large or many concurrent conversations

For a detailed methods paper, see [Polis: Scaling Deliberation by Mapping High Dimensional Opinion Spaces](https://www.e-revistes.uji.es/index.php/recerca/article/view/5516/6558)


(c) 2012-present, authors, under [AGPLv3 with additional permission under section 7](/LICENSE)
