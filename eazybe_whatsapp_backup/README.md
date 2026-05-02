# Eazybe WhatsApp Backup Odoo App

This Odoo app adds a contact-linked WhatsApp conversation experience inside Odoo for chat backups pushed from Eazybe.

## What it adds

- A conversation model: `x_eazybe_whatsapp_conversation`
- A message model: `x_eazybe_whatsapp_message`
- A contact tab: `WhatsApp Chats by Eazybe`
- A custom Owl component that renders messages as WhatsApp-like chat bubbles
- Lightweight in-tab refresh for the contact chat view

## Marketplace-first delivery

This module is now intended to be shipped as a normal Odoo app from a Git repository and published to Odoo Apps.

- The source folder is the source of truth.
- Generated zip files are only temporary local build artifacts and should not be committed as the primary delivery path.
- The module no longer depends on `base_import_module`.

## Local testing

If you still need to test quickly on a sandbox database before marketplace publication, you can package the folder locally and import it from Odoo developer mode.

## Before marketplace submission

- Add final marketplace assets in `static/description/`
- Add final icon/screenshots for the Odoo Apps listing
- Keep the app metadata in `__manifest__.py` aligned with the target Odoo version
