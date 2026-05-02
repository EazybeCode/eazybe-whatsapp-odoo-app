/** @odoo-module **/

import { Component, onMounted, onPatched, onWillStart, useRef, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";

const CONVERSATION_MODEL = "x_eazybe_whatsapp_conversation";
const MESSAGE_MODEL = "x_eazybe_whatsapp_message";

function getCurrentPartnerIdFromPath() {
    const match = window.location.pathname.match(/\/odoo\/contacts\/(\d+)(?:\/|$)/);
    if (!match) {
        return null;
    }

    const parsed = Number(match[1]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getCurrentPartnerId(props) {
    const recordIdCandidates = [
        props?.record?.resId,
        props?.record?.data?.id,
        props?.value,
    ];

    for (const value of recordIdCandidates) {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
        }
    }

    const routeId = Number(new URLSearchParams(window.location.hash.replace(/^#/, "")).get("id"));
    if (Number.isFinite(routeId) && routeId > 0) {
        return routeId;
    }

    const pathId = getCurrentPartnerIdFromPath();
    if (pathId) {
        return pathId;
    }

    const formView = document.querySelector(".o_form_view");
    const datasetValues = [
        formView?.dataset?.resId,
        formView?.getAttribute("data-res-id"),
        formView?.dataset?.id,
        formView?.getAttribute("data-id"),
    ];

    for (const value of datasetValues) {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
        }
    }

    return null;
}

function parseOdooDatetime(value) {
    if (!value) return null;
    const parsed = new Date(String(value).replace(" ", "T") + "Z");
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateLabel(date) {
    if (!date) return "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
        return "Today";
    }

    if (compareDate.getTime() === yesterday.getTime()) {
        return "Yesterday";
    }

    const sameYear = compareDate.getFullYear() === today.getFullYear();
    return new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        ...(sameYear ? {} : { year: "numeric" }),
    }).format(compareDate);
}

function formatTimeLabel(date) {
    if (!date) return "";
    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

function groupMessagesByDate(messages) {
    const groups = [];
    let currentLabel = null;
    let currentGroup = null;

    for (const message of messages) {
        const dateLabel = formatDateLabel(message.date);
        if (dateLabel !== currentLabel) {
            currentLabel = dateLabel;
            currentGroup = {
                label: dateLabel,
                messages: [],
            };
            groups.push(currentGroup);
        }

        currentGroup.messages.push(message);
    }

    return groups;
}

export class EazybeWhatsappConversationField extends Component {
    static template = "eazybe_whatsapp_backup.WhatsappConversationField";
    static props = {
        ...standardFieldProps,
    };
    static supportedTypes = ["char"];

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.scrollContainer = useRef("scrollContainer");
        this.state = useState({
            loading: true,
            totalMessages: 0,
            groups: [],
        });

        onWillStart(async () => {
            await this.loadMessages();
        });

        onMounted(() => {
            this.scrollToBottom();
        });

        onPatched(() => {
            this.scrollToBottom();
        });
    }

    get partnerId() {
        return getCurrentPartnerId(this.props);
    }

    scrollToBottom() {
        const container = this.scrollContainer.el;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    async loadMessages() {
        const partnerId = this.partnerId;
        if (!partnerId) {
            this.state.loading = false;
            this.state.totalMessages = 0;
            this.state.groups = [];
            return;
        }

        this.state.loading = true;

        try {
            const conversations = await this.orm.searchRead(
                CONVERSATION_MODEL,
                [["x_partner_id", "=", partnerId]],
                ["id", "x_chat_id", "x_latest_message_time", "x_message_count"],
                {
                    order: "x_latest_message_time asc, id asc",
                }
            );

            const conversationIds = (Array.isArray(conversations) ? conversations : [])
                .map((conversation) => Number(conversation.id))
                .filter((conversationId) => Number.isFinite(conversationId) && conversationId > 0);

            if (!conversationIds.length) {
                this.state.totalMessages = 0;
                this.state.groups = [];
                return;
            }

            const records = await this.orm.searchRead(
                MESSAGE_MODEL,
                [["x_conversation_id", "in", conversationIds]],
                [
                    "id",
                    "x_message_text",
                    "x_message_direction",
                    "x_sender_name",
                    "x_attachment_url",
                    "x_attachment_name",
                    "x_message_time",
                ],
                {
                    order: "x_message_time asc, id asc",
                }
            );

            const messages = (Array.isArray(records) ? records : []).map((record) => {
                const date = parseOdooDatetime(record.x_message_time);
                const direction = String(record.x_message_direction || "INCOMING").toUpperCase() === "OUTGOING"
                    ? "OUTGOING"
                    : "INCOMING";

                return {
                    id: Number(record.id),
                    date,
                    direction,
                    senderName: record.x_sender_name || (direction === "OUTGOING" ? "Eazybe User" : "Customer"),
                    text: record.x_message_text || "",
                    attachmentUrl: record.x_attachment_url || "",
                    attachmentName: record.x_attachment_name || "Open attachment",
                    timeLabel: formatTimeLabel(date),
                };
            });

            this.state.totalMessages = messages.length;
            this.state.groups = groupMessagesByDate(messages);
        } catch (error) {
            console.error("Eazybe WhatsApp chat refresh failed", error);
            this.notification.add("Unable to refresh WhatsApp chats for this contact.", {
                type: "warning",
            });
        } finally {
            this.state.loading = false;
        }
    }

    async refresh() {
        await this.loadMessages();
    }
}

const eazybeWhatsappConversationField = {
    component: EazybeWhatsappConversationField,
    supportedTypes: ["char"],
};

registry.category("fields").add(
    "eazybe_whatsapp_chat_conversation",
    eazybeWhatsappConversationField
);
