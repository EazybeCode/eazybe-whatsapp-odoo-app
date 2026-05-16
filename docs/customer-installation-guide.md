# WhatsApp Integration by Eazybe

## Customer Installation Guide

This document explains how a customer can install `WhatsApp Integration by Eazybe` in Odoo and connect it with Eazybe so WhatsApp chats are backed up inside Odoo.

---

## 1. What This App Does

After installation, the app adds a new tab on Odoo Contacts:

`WhatsApp Chats by Eazybe`

Once the Odoo database is connected to Eazybe and sync is completed, WhatsApp chats will appear inside this tab for matching contacts.

---

## 2. Supported Odoo Plansgetting these conflicts when i pushed the code and branch 

This app works on:

- `Odoo.sh`
- `On-premise / Self-hosted Odoo`
- `Partner-hosted Odoo` where addon installation is allowed

This app does **not** work on:

- `Odoo Online`

---

## 3. Which Button To Use On The Odoo Marketplace

Customers will see two options on the Odoo Apps page:

- `Deploy on Odoo.sh`
- `Download for v19.0`

Use them like this:

- `Deploy on Odoo.sh` → for customers using `Odoo.sh`
- `Download for v19.0` → for customers using `On-premise / Self-hosted Odoo`

---

## 4. Overall Installation Flow

The complete process is:

1. Install the app in Odoo
2. Confirm the `WhatsApp Chats by Eazybe` tab appears on Contacts
3. Generate an Odoo API key
4. Connect the Odoo database inside Eazybe
5. Run the first sync
6. Open a matching contact and verify chats are visible

---

## 5. Installation Flow For Odoo.sh Customers

### Step 1: Open the app page

1. Open the Odoo Apps page for `WhatsApp Integration by Eazybe`
2. Sign in with the same Odoo account linked to the Odoo.sh project

### Step 2: Deploy the app

1. Click `Deploy on Odoo.sh`
2. Select the correct Odoo.sh project
3. Select the correct branch
4. Confirm deployment

### Step 3: Wait for deployment

1. Open the Odoo.sh project
2. Wait for the build to complete successfully
3. Open the Odoo database connected to that branch

### Step 4: Install the app in Odoo

1. Open `Apps`
2. Search for `WhatsApp Integration by Eazybe`
3. If the app does not appear:
   - enable developer mode
   - click `Update Apps List`
   - search again
4. Click `Activate`

### Step 5: Verify installation

1. Open `Contacts`
2. Open any contact in form view
3. Confirm a tab called `WhatsApp Chats by Eazybe` is visible

At this stage, installation is complete. The tab may still be empty until sync is connected and data is pushed.

---

## 6. Installation Flow For On-Premise / Self-Hosted Customers

### Step 1: Download the app

1. Open the Odoo Apps page for `WhatsApp Integration by Eazybe`
2. Sign in
3. Click `Download for v19.0`
4. Save the ZIP file locally

### Step 2: Extract the ZIP file

1. Extract the downloaded ZIP
2. Keep the addon folder named exactly:

`eazybe_whatsapp_backup`

Important:

- do not rename this folder
- only this addon folder should be installed

### Step 3: Copy the addon into Odoo's custom addons path

Copy the folder:

`eazybe_whatsapp_backup`

into the customer’s custom addons directory.

Common examples:

- `/opt/odoo/custom-addons/`
- `/mnt/extra-addons/`
- `/odoo/custom/addons/`

If the customer is using Docker, copy it into the host folder that is mounted to Odoo’s custom addons path.

### Step 4: Restart Odoo

After copying the addon, restart the Odoo service so the app is detected.

Example commands:

```bash
sudo systemctl restart odoo
```

or

```bash
docker compose restart odoo
```

or

```bash
docker restart odoo
```

### Step 5: Enable developer mode

Use either method:

Method 1:

- go to `Settings`
- open `Developer Tools`
- click `Activate the developer mode`

Method 2:

- add `?debug=1` at the end of the Odoo URL

Example:

```text
https://your-odoo-domain.com/odoo?debug=1
```

### Step 6: Update the apps list

1. Open `Apps`
2. Click `Update Apps List`
3. Click `Update`

### Step 7: Install the app

1. Search for:
   - `WhatsApp Integration by Eazybe`
   - or `eazybe_whatsapp_backup`
2. If the app does not appear:
   - remove the default `Apps` filter if needed
   - use the `Extra` filter if needed
3. Click `Activate`

### Step 8: Verify installation

1. Open `Contacts`
2. Open any contact in form view
3. Confirm a tab called `WhatsApp Chats by Eazybe` is visible

At this stage, installation is complete. The tab may still be empty until sync is connected and data is pushed.

---

## 7. Post-Installation Setup In Odoo

Installing the app only adds the Odoo tab and required models.

To make chats appear, the customer must connect the Odoo database with Eazybe.

### Step 1: Generate an Odoo API key

1. Click the top-right user avatar
2. Open `Preferences`
3. Open `Account Security`
4. Click `New API Key`
5. Enter a label such as `Eazybe Odoo Integration`
6. Select the API key duration
7. Generate the key
8. Copy the key and save it securely

Important:

- the key is shown only once
- if the key expires later, a new key must be generated and updated in Eazybe

### Step 2: Collect the Odoo connection details

The customer will need these three values:

- `Base URL`
- `Database Name`
- `API Key`

Examples:

- `Base URL`: `https://customer-odoo.example.com`
- `Database Name`: the Odoo database name
- `API Key`: the key created above

---

## 8. Connect Odoo In Eazybe

After installation, connect Odoo in Eazybe using:

- Odoo Base URL
- Odoo Database Name
- Odoo API Key

This step is done either:

- directly by the customer in the Eazybe setup screen
- or with help from the Eazybe onboarding/support team

---

## 9. Run The First Sync

Once Odoo is connected in Eazybe:

1. Trigger the first Odoo sync from Eazybe
2. Wait for the initial sync to complete

During this sync, Eazybe pushes WhatsApp backup data into Odoo.

---

## 10. Verify The Chats In Odoo

1. Open `Contacts`
2. Open a contact whose WhatsApp number exists in Eazybe
3. Open the tab `WhatsApp Chats by Eazybe`
4. Verify that the WhatsApp conversation is visible

If the tab is visible but empty, one of these is likely true:

- the first sync has not completed yet
- the Odoo contact number does not match any WhatsApp number in Eazybe
- the Odoo connection is incomplete or invalid

---

## 11. Recommended Contact Matching Practice

Before running sync, make sure the relevant contacts exist in Odoo with the correct phone number.

Recommended examples:

- `+91 99999 99999`
- `+1 202 555 0101`

This helps Eazybe map WhatsApp data to the correct Odoo contact.

---

## 12. Troubleshooting

### The app does not appear in Apps

Check the following:

- developer mode is enabled
- `Update Apps List` has been run
- the folder name is exactly `eazybe_whatsapp_backup`
- the addon was copied into the correct addons path
- Odoo was restarted after copying the addon

### The tab appears but chats are not visible

Check the following:

- Odoo is connected inside Eazybe
- the API key is valid
- the first sync has completed
- the contact phone number matches the WhatsApp number in Eazybe

### The customer is on Odoo Online

This app is not supported on Odoo Online.

The customer should use:

- `Odoo.sh`
- or `On-premise / Self-hosted Odoo`

---

## 13. Final Handover Checklist

Before considering setup complete, confirm:

- app installed successfully
- `WhatsApp Chats by Eazybe` tab is visible on Contacts
- Odoo API key has been generated
- Odoo has been connected in Eazybe
- first sync has been run
- at least one contact shows WhatsApp chat backup correctly

---

## 14. Simple Customer Summary

1. Install the app in Odoo
2. Generate an Odoo API key
3. Connect Odoo in Eazybe
4. Run the first sync
5. Open a Contact and view chats in `WhatsApp Chats by Eazybe`

---

## 15. Official Odoo References

- Developer mode: https://www.odoo.com/documentation/19.0/applications/general/developer_mode.html
- Apps and modules: https://www.odoo.com/documentation/19.0/applications/general/apps_modules.html
- External API and API keys: https://www.odoo.com/documentation/19.0/developer/reference/external_api.html
- Odoo.sh: https://www.odoo.com/documentation/19.0/administration/odoo_sh.html
- On-premise: https://www.odoo.com/documentation/19.0/administration/on_premise.html

