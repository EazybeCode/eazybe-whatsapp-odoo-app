# Frontend Local Testing Guide

## WhatsApp Integration by Eazybe

This guide explains how frontend developers can test the Odoo app locally.

---

## 1. Do Frontend Developers Need The Full Backend Code?

No.

Frontend developers do **not** need the full NestJS backend code just to run the Odoo app locally and test the UI.

For local Odoo app testing, they only need:

- the Odoo app repo or addon folder
- Docker Desktop
- the Docker compose file

They do **not** need:

- the full Eazybe NestJS backend code
- the Mongo backup repo
- the full marketplace repo history

---

## 2. What They Need To Download

Frontend developers need this folder:

`eazybe-whatsapp-odoo-app`

At minimum, it should contain:

- `eazybe_whatsapp_backup/`
- `docker-compose.local.yml`

---

## 3. What They Can Test Without Backend

Using only Docker and the Odoo addon, frontend developers can test:

- module installation in Odoo
- visibility of the `WhatsApp Chats by Eazybe` tab
- contact form UI
- empty state UI
- app assets loading properly

This is enough for:

- UI testing
- layout testing
- CSS testing
- frontend behavior inside Odoo

---

## 4. What They Cannot Test Without Backend

Without backend connection, they cannot test:

- real WhatsApp chat data syncing into Odoo
- end-to-end chat backup flow
- actual conversation rendering with live synced data

For that, backend help is required.

---

## 5. Local Setup Steps For Frontend

### Step 1: Install Docker Desktop

Install Docker Desktop on the machine if it is not already installed.

### Step 2: Get the Odoo app repo

Frontend should get this folder locally:

`eazybe-whatsapp-odoo-app`

### Step 3: Open Terminal in the repo

Run:

```bash
cd /path/to/eazybe-whatsapp-odoo-app
```

### Step 4: Start Odoo with Docker

Run:

```bash
docker compose -f docker-compose.local.yml up -d
```

This starts:

- PostgreSQL
- Odoo 19

### Step 5: Open Odoo in browser

Open:

```text
http://localhost:8069
```

### Step 6: Create the local Odoo database

Fill the database creation screen with simple test values:

- `Master Password`: keep the generated one
- `Database Name`: `eazybe_local_test`
- `Email`: your email
- `Password`: any password you will remember

Then click:

- `Create database`

### Step 7: Enable developer mode

After login, add `?debug=1` to the URL.

Example:

```text
http://localhost:8069/odoo?debug=1
```

### Step 8: Install the app

1. Open `Apps`
2. Click `Update Apps List`
3. Search for:
   - `eazybe`
   - or `eazybe_whatsapp_backup`
4. Click `Activate`

### Step 9: Verify the app

1. Open `Contacts`
2. Open any contact
3. Confirm the tab `WhatsApp Chats by Eazybe` is visible

If the tab is visible, the frontend setup is working.

---

## 6. What Frontend Should Expect In Local Testing

After installation, frontend should see:

- the `WhatsApp Chats by Eazybe` tab on Contacts
- an empty state if no chats are synced yet

This is expected.

Without backend sync, the chat area may show no data.

---

## 7. If Frontend Also Wants To Test With Real Synced Data

For this, frontend will need support from backend or onboarding team.

They will need:

- a working Odoo API key generated from the local Odoo database
- the local Odoo base URL
- the local Odoo database name
- Eazybe backend connection to this Odoo database

Only after that can real synced chats appear in Odoo.

---

## 8. Summary For Frontend Team

Frontend developers do **not** need the full backend code to run the Odoo app locally.

They only need:

- the Odoo app repo
- Docker Desktop
- the provided Docker compose file

They can use this setup to test:

- app installation
- contact tab UI
- frontend rendering

If they want real synced chat data, backend setup will be required in addition.

