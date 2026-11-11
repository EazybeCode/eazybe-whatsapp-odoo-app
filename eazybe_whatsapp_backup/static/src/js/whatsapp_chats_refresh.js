/** @odoo-module **/

import { Component, onMounted, onPatched, onWillStart, onWillUnmount, useRef, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService } from "@web/core/utils/hooks";
import { user } from "@web/core/user";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const CONVERSATION_MODEL = "x_eazybe_whatsapp_conversation";
const MESSAGE_MODEL = "x_eazybe_whatsapp_message";
const ALL_WORKSPACES = "all";
const EAZYBE_API_V2_BASE_URL = "https://cerberus.eazybe.com/prod/api/v2";

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

function normalizeWorkspaceId(value) {
    if (value === undefined || value === null || value === false || value === "") {
        return null;
    }

    return String(value);
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
        this.workspaceDropdown = useRef("workspaceDropdown");
        this.state = useState({
            loading: true,
            totalMessages: 0,
            allMessages: [],
            groups: [],
            workspaceOptions: [],
            selectedWorkspaceId: ALL_WORKSPACES,
            workspaceEmployeeMap: {},
            workspaceDropdownOpen: false,
            // 1:1 and group chats are never mixed: section "direct" = the 1:1 chat,
            // section "group" = one view per WhatsApp group (selectedGroupId).
            section: "direct",
            directTotal: 0,
            groupChats: [],
            selectedGroupId: null,
        });
        this.conversationById = new Map();
        this.workspaceEmailById = {};
        this.userPickedWorkspace = false;

        onWillStart(async () => {
            await this.loadMessages();
        });

        onMounted(() => {
            this.boundCloseWorkspaceDropdown = this.closeWorkspaceDropdownOnOutsideClick.bind(this);
            document.addEventListener("click", this.boundCloseWorkspaceDropdown);
            this.scrollToBottom();
        });

        onPatched(() => {
            this.scrollToBottom();
        });

        onWillUnmount(() => {
            if (this.boundCloseWorkspaceDropdown) {
                document.removeEventListener("click", this.boundCloseWorkspaceDropdown);
            }
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

    get showWorkspaceSelector() {
        return this.state.workspaceOptions.length > 1;
    }

    getWorkspaceLabel(workspaceId) {
        if (!workspaceId || workspaceId === ALL_WORKSPACES) {
            return "All Workspaces";
        }

        return this.state.workspaceEmployeeMap[workspaceId] || `Workspace ${workspaceId}`;
    }

    closeWorkspaceDropdownOnOutsideClick(event) {
        const dropdownEl = this.workspaceDropdown.el;
        if (dropdownEl && !dropdownEl.contains(event.target)) {
            this.state.workspaceDropdownOpen = false;
        }
    }

    toggleWorkspaceDropdown() {
        this.state.workspaceDropdownOpen = !this.state.workspaceDropdownOpen;
    }

    getUniqueWorkspaceIds(messages) {
        const workspaceIds = new Set();

        for (const message of messages || []) {
            const workspaceId = normalizeWorkspaceId(message.workspaceId);
            if (workspaceId) {
                workspaceIds.add(workspaceId);
            }
        }

        return Array.from(workspaceIds).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }

    filterMessagesByWorkspace(messages, workspaceId) {
        if (!workspaceId || workspaceId === ALL_WORKSPACES) {
            return messages || [];
        }

        return (messages || []).filter((message) => {
            const messageWorkspaceId = normalizeWorkspaceId(message.workspaceId);
            return !messageWorkspaceId || messageWorkspaceId === workspaceId;
        });
    }

    get groupMessageTotal() {
        return this.state.groupChats.reduce((sum, chat) => sum + chat.total, 0);
    }

    get selectedGroupChat() {
        return this.state.groupChats.find((chat) => chat.id === this.state.selectedGroupId)
            || this.state.groupChats[0]
            || null;
    }

    selectSection(section) {
        this.state.section = section;
        this.applyWorkspaceFilter();
    }

    selectGroup(groupId) {
        this.state.section = "group";
        this.state.selectedGroupId = groupId;
        this.applyWorkspaceFilter();
    }

    /**
     * Workspace filter first (as before), then split: 1:1 messages in one timeline, each WhatsApp
     * group in its own (keyed by group id, so a group backed up by several colleagues shows once).
     * `state.groups` stays "the date-grouped messages on screen".
     */
    applyWorkspaceFilter() {
        const filteredMessages = this.filterMessagesByWorkspace(
            this.state.allMessages,
            this.state.selectedWorkspaceId
        );

        const directMessages = [];
        const byGroup = new Map();
        for (const message of filteredMessages) {
            const conversation = this.conversationById.get(message.conversationId);
            if (!conversation?.isGroup) {
                directMessages.push(message);
                continue;
            }
            const key = conversation.chatId || `conversation-${message.conversationId}`;
            if (!byGroup.has(key)) {
                byGroup.set(key, { id: key, name: conversation.name || "WhatsApp group", messages: [] });
            }
            byGroup.get(key).messages.push(message);
        }

        const groupChats = [...byGroup.values()]
            .map((chat) => ({
                id: chat.id,
                name: chat.name,
                total: chat.messages.length,
                latest: chat.messages[chat.messages.length - 1]?.date?.getTime() || 0,
                messages: chat.messages,
            }))
            .sort((a, b) => b.latest - a.latest);

        this.state.directTotal = directMessages.length;
        this.state.groupChats = groupChats.map(({ messages, ...chat }) => chat);
        if (!groupChats.some((chat) => chat.id === this.state.selectedGroupId)) {
            this.state.selectedGroupId = groupChats[0]?.id || null;
        }
        if (this.state.section === "group" && !groupChats.length) this.state.section = "direct";
        if (this.state.section === "direct" && !directMessages.length && groupChats.length) this.state.section = "group";

        const visible = this.state.section === "group"
            ? (groupChats.find((chat) => chat.id === this.state.selectedGroupId)?.messages || [])
            : directMessages;
        this.state.totalMessages = filteredMessages.length;
        this.state.groups = groupMessagesByDate(visible);
    }

    /**
     * Names for the workspace dropdown. `/workspace/info` answers `data.workspace.name` for the
     * workspace asked, and `data.employees` only for some (often empty), so each workspace that
     * still has no name is asked once, in parallel. A failed call leaves "Workspace <id>".
     */
    async fetchEmployeeList(workspaceIds) {
        const mapping = { ...this.state.workspaceEmployeeMap };
        const missing = (workspaceIds || []).filter((workspaceId) => workspaceId && !mapping[workspaceId]);
        if (!missing.length) {
            return;
        }

        await Promise.all(missing.map(async (workspaceId) => {
            try {
                const response = await fetch(
                    `${EAZYBE_API_V2_BASE_URL}/workspace/info?workspace_id=${encodeURIComponent(workspaceId)}`
                );
                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                const employees = Array.isArray(data?.data?.employees) ? data.data.employees : [];
                for (const employee of employees) {
                    const employeeWorkspaceId = normalizeWorkspaceId(employee?.workspace_id);
                    if (employeeWorkspaceId && employee?.full_name && !mapping[employeeWorkspaceId]) {
                        mapping[employeeWorkspaceId] = employee.full_name;
                    }
                }

                const ownName = String(data?.data?.workspace?.name || "").trim();
                if (ownName) {
                    mapping[workspaceId] = ownName;
                }
                // Kept to open the logged-in user's own chats by default (see pickDefaultWorkspace).
                const ownEmail = normalizeEmail(data?.data?.workspace?.email);
                if (ownEmail) {
                    this.workspaceEmailById[workspaceId] = ownEmail;
                }
            } catch (error) {
                console.error(`Unable to fetch Eazybe workspace ${workspaceId}`, error);
            }
        }));

        this.state.workspaceEmployeeMap = mapping;
    }

    /** The logged-in Odoo user's email and login (lower-cased), read once. Empty on failure. */
    async getCurrentUserEmails() {
        if (this.currentUserEmails) {
            return this.currentUserEmails;
        }
        const emails = new Set();
        try {
            const userId = user?.userId;
            if (userId) {
                const rows = await this.orm.read("res.users", [userId], ["login", "email"]);
                for (const row of Array.isArray(rows) ? rows : []) {
                    [row?.login, row?.email].map(normalizeEmail).filter((value) => value.includes("@")).forEach((value) => emails.add(value));
                }
            }
        } catch (error) {
            console.warn("Eazybe: could not read the current Odoo user's email", error);
        }
        this.currentUserEmails = emails;
        return emails;
    }

    /**
     * Opens on the logged-in user's own workspace: the Eazybe workspace whose email equals the Odoo
     * user's email or login. Only until the user picks a workspace by hand; no match → "All Workspaces".
     */
    async pickDefaultWorkspace(workspaceOptions) {
        if (this.userPickedWorkspace || !workspaceOptions.length) {
            return;
        }
        const emails = await this.getCurrentUserEmails();
        if (!emails.size) {
            return;
        }
        const mine = workspaceOptions.find((workspaceId) => emails.has(this.workspaceEmailById[workspaceId]));
        if (mine) {
            this.state.selectedWorkspaceId = mine;
        }
    }

    selectWorkspace(workspaceId) {
        this.userPickedWorkspace = true;
        this.state.selectedWorkspaceId = workspaceId || ALL_WORKSPACES;
        this.state.workspaceDropdownOpen = false;
        this.applyWorkspaceFilter();
    }

    selectWorkspaceFromEvent(event) {
        this.selectWorkspace(event.currentTarget?.dataset?.workspaceId || ALL_WORKSPACES);
    }

    async loadMessages() {
        const partnerId = this.partnerId;
        if (!partnerId) {
            this.state.loading = false;
            this.state.totalMessages = 0;
            this.state.allMessages = [];
            this.state.groups = [];
            this.state.workspaceOptions = [];
            this.state.selectedWorkspaceId = ALL_WORKSPACES;
            return;
        }

        this.state.loading = true;

        try {
            const conversations = await this.orm.searchRead(
                CONVERSATION_MODEL,
                [["x_partner_id", "=", partnerId]],
                ["id", "x_name", "x_chat_id", "x_is_group_chat", "x_latest_message_time", "x_message_count"],
                {
                    order: "x_latest_message_time asc, id asc",
                }
            );

            const conversationIds = (Array.isArray(conversations) ? conversations : [])
                .map((conversation) => Number(conversation.id))
                .filter((conversationId) => Number.isFinite(conversationId) && conversationId > 0);

            // A conversation is a group chat when flagged, or when its chat id is a WhatsApp group id.
            this.conversationById = new Map((Array.isArray(conversations) ? conversations : []).map((conversation) => [
                Number(conversation.id),
                {
                    isGroup: Boolean(conversation.x_is_group_chat) || String(conversation.x_chat_id || "").endsWith("@g.us"),
                    chatId: String(conversation.x_chat_id || ""),
                    name: String(conversation.x_name || "").trim(),
                },
            ]));

            if (!conversationIds.length) {
                this.state.totalMessages = 0;
                this.state.allMessages = [];
                this.state.groups = [];
                this.state.workspaceOptions = [];
                this.state.selectedWorkspaceId = ALL_WORKSPACES;
                return;
            }

            const records = await this.orm.searchRead(
                MESSAGE_MODEL,
                [["x_conversation_id", "in", conversationIds]],
                [
                    "id",
                    "x_conversation_id",
                    "x_message_text",
                    "x_message_direction",
                    "x_sender_name",
                    "x_attachment_url",
                    "x_attachment_name",
                    "x_message_time",
                    "x_workspace_id",
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
                    conversationId: Number(Array.isArray(record.x_conversation_id) ? record.x_conversation_id[0] : record.x_conversation_id),
                    date,
                    direction,
                    senderName: record.x_sender_name || (direction === "OUTGOING" ? "Eazybe User" : "Customer"),
                    text: record.x_message_text || "",
                    attachmentUrl: record.x_attachment_url || "",
                    attachmentName: record.x_attachment_name || "Open attachment",
                    timeLabel: formatTimeLabel(date),
                    workspaceId: normalizeWorkspaceId(record.x_workspace_id),
                };
            });

            const workspaceOptions = this.getUniqueWorkspaceIds(messages);
            this.state.allMessages = messages;
            this.state.workspaceOptions = workspaceOptions;

            if (
                this.state.selectedWorkspaceId !== ALL_WORKSPACES &&
                !workspaceOptions.includes(this.state.selectedWorkspaceId)
            ) {
                this.state.selectedWorkspaceId = ALL_WORKSPACES;
            }

            await this.fetchEmployeeList(workspaceOptions);
            await this.pickDefaultWorkspace(workspaceOptions);
            this.applyWorkspaceFilter();
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
