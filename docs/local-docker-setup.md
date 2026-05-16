# Local Docker Setup

## Start Odoo locally

Run these commands from the repo root:

```bash
cd /Users/aryansharma/Desktop/Eazybe/eazybe-whatsapp-odoo-app
docker compose -f docker-compose.local.yml up -d
```

Then open:

```text
http://localhost:8069
```

## Create the database

Use any values you like, for example:

- Master Password: keep the generated one
- Database Name: `eazybe_local_test`
- Email: your email
- Password: any password you will remember

## Install the app

1. Open the database
2. Add `?debug=1` to the URL
3. Open `Apps`
4. Click `Update Apps List`
5. Search for `eazybe` or `eazybe_whatsapp_backup`
6. Click `Activate`

## Verify the app

1. Open `Contacts`
2. Open any contact
3. Confirm the `WhatsApp Chats by Eazybe` tab is visible

## Stop the stack

```bash
docker compose -f docker-compose.local.yml down
```

## Reset the stack completely

```bash
docker compose -f docker-compose.local.yml down -v
```
