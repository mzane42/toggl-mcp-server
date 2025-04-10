import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Buffer } from "buffer";

// APIの基本設定
const TOGGL_API_URL = "https://api.track.toggl.com/api/v9";
const TOGGL_API_TOKEN = process.env.TOGGL_API_TOKEN || "";

// トークン認証用のヘルパー関数
const getAuthHeaderWithToken = (token: string) => {
    const auth = Buffer.from(`${token}:api_token`).toString("base64");
    return `Basic ${auth}`;
};

// APIリクエストを実行する共通関数
const executeApiRequest = async <T>(
    url: string,
    method: string,
    body?: any
): Promise<T> => {
    try {
        if (!TOGGL_API_TOKEN) {
            throw new Error("環境変数 TOGGL_API_TOKEN が設定されていません");
        }

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": getAuthHeaderWithToken(TOGGL_API_TOKEN)
            },
            ...(body && { body: JSON.stringify(body) })
        });

        if (!response.ok) {
            throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
        }

        if (method === "DELETE") {
            return { message: "正常に削除されました" } as T;
        }

        return await response.json();
    } catch (error) {
        throw new Error(`APIリクエストエラー: ${error instanceof Error ? error.message : String(error)}`);
    }
};

// レスポンスを整形する共通関数
const formatResponse = (data: any) => ({
    content: [{
        type: "text" as const,
        text: JSON.stringify(data, null, 2)
    }]
});

// エラーを処理する共通関数
const handleError = (error: unknown) => ({
    content: [{
        type: "text" as const,
        text: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
    }]
});

// Create an MCP server
const server = new McpServer({
    name: "Toggl MCP Server",
    version: "1.0.0"
});

// Time entriesを取得するツール (環境変数のAPIトークンを使用)
server.tool("get_time_entries",
    {
        startDate: z.string().optional().describe('開始日時（ISO 8601形式 例: 2024-04-08T00:00:00Z）'),
        endDate: z.string().optional().describe('終了日時（ISO 8601形式 例: 2024-04-14T23:59:59Z）'),
        before: z.string().optional().describe('この日時より前のエントリを取得（ISO 8601形式）'),
        since: z.number().optional().describe('このUNIXタイムスタンプ以降のエントリを取得')
    },
    async ({ startDate, endDate, before, since }, extra) => {
        try {
            // 日付形式のバリデーション
            if (startDate && !isValidISODate(startDate)) {
                throw new Error('startDateが不正なISO 8601形式です');
            }
            if (endDate && !isValidISODate(endDate)) {
                throw new Error('endDateが不正なISO 8601形式です');
            }
            if (before && !isValidISODate(before)) {
                throw new Error('beforeが不正なISO 8601形式です');
            }

            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append("start_date", startDate);
            if (endDate) queryParams.append("end_date", endDate);
            if (before) queryParams.append("before", before);
            if (since) queryParams.append("since", since.toString());
            
            const url = `${TOGGL_API_URL}/me/time_entries${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const data = await executeApiRequest(url, "GET");
            return formatResponse(data);
        } catch (error) {
            return handleError(error);
        }
    }
);

// ISO 8601形式の日付をバリデートする関数
function isValidISODate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString.includes('T');
}

// 現在実行中のTime entryを取得するツール
server.tool("get_current_time_entry",
    {},
    async (args, extra) => {
        try {
            const url = `${TOGGL_API_URL}/me/time_entries/current`;
            const data = await executeApiRequest(url, "GET");
            return formatResponse(data);
        } catch (error) {
            return handleError(error);
        }
    }
);

// Time entryを作成するツール
server.tool("create_time_entry",
    {
        workspaceId: z.number(),
        description: z.string().optional(),
        projectId: z.number().optional(),
        taskId: z.number().optional(),
        billable: z.boolean().optional(),
        start: z.string(),
        duration: z.number().optional(),
        tags: z.array(z.string()).optional()
    },
    async ({ workspaceId, description, projectId, taskId, billable, start, duration, tags }, extra) => {
        try {
            const url = `${TOGGL_API_URL}/workspaces/${workspaceId}/time_entries`;
            const data = await executeApiRequest(url, "POST", {
                description,
                project_id: projectId,
                task_id: taskId,
                billable,
                start,
                duration,
                tags
            });
            return formatResponse(data);
        } catch (error) {
            return handleError(error);
        }
    }
);

// Time entryを一括編集するツール
server.tool("bulk_edit_time_entries",
    {
        workspaceId: z.number(),
        timeEntryIds: z.array(z.number()),
        projectId: z.number().optional(),
        taskId: z.number().optional(),
        tags: z.array(z.string()).optional(),
        billable: z.boolean().optional()
    },
    async ({ workspaceId, timeEntryIds, projectId, taskId, tags, billable }, extra) => {
        try {
            const url = `${TOGGL_API_URL}/workspaces/${workspaceId}/time_entries`;
            const data = await executeApiRequest(url, "PATCH", {
                time_entry_ids: timeEntryIds,
                project_id: projectId,
                task_id: taskId,
                tags,
                billable
            });
            return formatResponse(data);
        } catch (error) {
            return handleError(error);
        }
    }
);

// Time entryを更新するツール
server.tool("update_time_entry",
    {
        workspaceId: z.number(),
        timeEntryId: z.number(),
        description: z.string().optional(),
        projectId: z.number().optional(),
        taskId: z.number().optional(),
        billable: z.boolean().optional(),
        start: z.string().optional(),
        duration: z.number().optional(),
        tags: z.array(z.string()).optional()
    },
    async ({ workspaceId, timeEntryId, description, projectId, taskId, billable, start, duration, tags }, extra) => {
        try {
            const url = `${TOGGL_API_URL}/workspaces/${workspaceId}/time_entries/${timeEntryId}`;
            const data = await executeApiRequest(url, "PUT", {
                description,
                project_id: projectId,
                task_id: taskId,
                billable,
                start,
                duration,
                tags
            });
            return formatResponse(data);
        } catch (error) {
            return handleError(error);
        }
    }
);

// Time entryを削除するツール
server.tool("delete_time_entry",
    {
        workspaceId: z.number(),
        timeEntryId: z.number()
    },
    async ({ workspaceId, timeEntryId }, extra) => {
        try {
            const url = `${TOGGL_API_URL}/workspaces/${workspaceId}/time_entries/${timeEntryId}`;
            const data = await executeApiRequest(url, "DELETE");
            return formatResponse(data);
        } catch (error) {
            return handleError(error);
        }
    }
);

// Time entryを停止するツール
server.tool("stop_time_entry",
    {
        workspaceId: z.number(),
        timeEntryId: z.number()
    },
    async ({ workspaceId, timeEntryId }, extra) => {
        try {
            const url = `${TOGGL_API_URL}/workspaces/${workspaceId}/time_entries/${timeEntryId}/stop`;
            const data = await executeApiRequest(url, "PATCH");
            return formatResponse(data);
        } catch (error) {
            return handleError(error);
        }
    }
);

// ワークスペース一覧を取得するツール
server.tool("get_workspaces",
    {},
    async (_, extra) => {
        try {
            const url = `${TOGGL_API_URL}/workspaces`;
            const data = await executeApiRequest(url, "GET");
            return formatResponse(data);
        } catch (error) {
            return handleError(error);
        }
    }
);

// ワークスペース内のプロジェクト一覧を取得するツール
server.tool("get_workspace_projects",
    {
        workspaceId: z.number(),
        active: z.boolean().optional(), // アクティブなプロジェクトのみを取得するかどうか
        page: z.number().optional(), // ページ番号（ページネーション用）
        perPage: z.number().optional() // 1ページあたりの件数
    },
    async ({ workspaceId, active, page, perPage }, extra) => {
        try {
            const queryParams = new URLSearchParams();
            if (active !== undefined) queryParams.append("active", active.toString());
            if (page !== undefined) queryParams.append("page", page.toString());
            if (perPage !== undefined) queryParams.append("per_page", perPage.toString());

            const url = `${TOGGL_API_URL}/workspaces/${workspaceId}/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const data = await executeApiRequest(url, "GET");
            return formatResponse(data);
        } catch (error) {
            return handleError(error);
        }
    }
);

// Add a dynamic greeting resource
server.resource(
    "greeting",
    new ResourceTemplate("greeting://{name}", { list: undefined }),
    async (uri, { name }) => ({
        contents: [{
            uri: uri.href,
            text: `Hello, ${name}!`
        }]
    })
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);