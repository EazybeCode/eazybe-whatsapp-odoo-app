{
    "name": "WhatsApp Integration by Eazybe",
    "version": "19.0.1.0.0",
    "summary": "Connect Personal WhatsApp or WhatsApp Business to Odoo - No API",
    "category": "Marketing",
    "license": "OPL-1",
    "author": "Eazybe",
    "maintainer": "Eazybe",
    "website": "https://eazybe.com",
    "support": "hey@eazybe.com",
    "depends": [
        "base",
        "contacts",
        "crm",
    ],
    "data": [
        "models/whatsapp_backup_model.xml",
        "security/whatsapp_backup_access.xml",
        "views/whatsapp_backup_views.xml",
    ],
    "images": [
        "images/main_screenshot.png",
        "images/chat_list.png",
        "images/contact_tab.png",
    ],
    "assets": {
        "web.assets_backend": [
            "eazybe_whatsapp_backup/static/src/js/whatsapp_chats_refresh.js",
            "eazybe_whatsapp_backup/static/src/xml/whatsapp_chats_refresh.xml",
            "eazybe_whatsapp_backup/static/src/scss/whatsapp_chats_refresh.scss",
        ],
    },
    "application": False,
    "installable": True,
}
