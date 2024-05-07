# Deploying Metropolis to AWS

Deploying Metropolis to EC2 and RDS.

## Provisioning EC2 and RDS

Creating an EC2 instance:

1. In the AWS Console, create an EC2 instance from https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#LaunchInstances.
2. Select "Ubuntu 24.04 Server", 64-bit, x86. Create and select a key pair (.pem file).
3. Select "Allow HTTPS and Allow HTTP traffic from the internet".

Creating an RDS database:

1. Select "Create a new RDS database" to go to the RDS service.
2. Select Standard create, Aurora, compatible with PostgreSQL v15.4.
3. Select a database name, e.g. "metropolis-database-1".
4. Select self generated password.
5. Select "burstable classes", "db.t3.medium" or similar (less expensive).
6. Don't create an Aurora replica.
7. Select "Connect to an EC2 compute resource" and select the EC2 container you just created.
8. You may disable DevOps Guru.
9. Select "Create Database" and then "View credential details" and record your username, master password, and endpoint.

## Setting up the server

Using the pem file downloaded earlier, ssh into your EC2 instance using its IP address.
Assuming you saved it as metropolis.pem, the command should look like:

```
ssh -i metropolis.pem ubuntu@44.201.179.198
```

## Install nvm and packages

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Restart your session by ssh-ing in again, or run the provided commands to enable nvm on your current shell.

```
git clone https://github.com/canvasxyz/metropolis.git
cd metropolis
```

From inside the metropolis directory, install Node:

```
nvm install
nvm use
```

## Build the source code

```
sudo apt update
sudo apt install make g++ postgresql postgresql-contrib libpq-dev -y
npm i
npm run build
```

## Install foreman

```
sudo apt update
sudo apt install ruby-foreman
```

## Set up the database

```
psql postgres://postgres:<PASSWORD>@metropolis-database-1.cluster-caf68fkacdb4.us-east-1.rds.amazonaws.com
```

From a `psql` console run:

```
create database "metropolis";
create user "metropolis";
grant all privileges on database "metropolis" to "metropolis";
```

Then, run migrations from the command line:

```
cat server/postgres/migrations/* | psql postgres://postgres:<PASSWORD>@metropolis-database-1.cluster-caf68fkacdb4.us-east-1.rds.amazonaws.com
```

## Set up Github

You should create a Github application, which gives you an
Github App Client ID, Client Secret, and App ID.
You can do this from https://github.com/settings/apps.

You should provide two callback URLs of the form:

```
https://metropolis.vote/api/v3/github_oauth_callback?dest=https://metropolis.vote/
https://metropolis.vote/api/v3/github_oauth_callback?dest=https://metropolis.vote/dashboard
```

You should turn the webhook option off.

Once you've created it, it will let you generate a client secret.

(This part is optional) Then, install it on your Metropolis repo.
This will give you an installation ID and private key.

## Set up environment variables

Create a file called .env at /home/metropolis/.env with these contents,
with the <bracketed> items filled in:

```
DEV_MODE=false
MATH_ENV=prod
NODE_OPTIONS=--max_old_space_size=2560
API_PROD_HOSTNAME=metropolis.vote
DOMAIN_OVERRIDE=metropolis.vote
EMBED_SERVICE_HOSTNAME=metropolis.vote
API_PROD_HOSTNAME=metropolis.vote
FIP_REPO_NAME=FIPs
FIP_REPO_OWNER=filecoin-project
GH_APP_CLIENT_ID=<from github>
GH_APP_CLIENT_SECRET=<from github>
GH_APP_ID=<from github>
GH_APP_INSTALLATION_ID=<from github>
GH_APP_PRIVATE_KEY=<from github>
DATABASE_URL=<postgres>=<password>@metropolis-database-1.cluster-caf68fkacdb4.us-east-1.rds.amazonaws.com/metropolis
POLIS_FROM_ADDRESS=<administrator email>
SENDGRID_API_KEY=<sendgrid API key>
```

For the database URL, take the username, password, and hostname from
Amazon RDS and format them as a Postgres URL, and then provide that:
`postgres://<username>:<password>@localhost:5432/<database name>`

For the from address, you can use an existing admininistrative email.

For the Sendgrid API key, sign up for a
[SendGrid account](https://sendgrid.com/en-us).

## Create a systemd service

Open a text editor:

```
cd /etc/systemd/system
sudo nano metropolis.service
```

Provide this as the file contents:

```
[Unit]
Description=Metropolis Server

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/metropolis
ExecStart=export $(cat .env | xargs) && foreman start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

## Starting the application

Reload systemd and start the service on every boot:
```
sudo systemctl daemon-reload
sudo systemctl start metropolis.service
sudo systemctl enable metropolis.service
```
