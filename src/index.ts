import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Buffer } from "buffer";

// Basic API configuration
const TOGGL_API_URL = "https://api.track.toggl.com/api/v9";
const TOGGL_API_TOKEN = process.env.TOGGL_API_TOKEN || "";

// Helper function for token authentication
const getAuthHeaderWithToken = (token: string) => {
    const auth = Buffer.from(`${token}:api_token`).toString("base64");
    return `Basic ${auth}`;
};

// Common function to execute API requests
const executeApiRequest = async <T>(
    url: string,
    method: string,
    body?: any
): Promise<T> => {
    try {
        if (!TOGGL_API_TOKEN) {
            throw new Error("Environment variable TOGGL_API_TOKEN is not set");
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
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        if (method === "DELETE") {
            return { message: "Successfully deleted" } as T;
        }

        return await response.json();
    } catch (error) {
        throw new Error(`API Request Error: ${error instanceof Error ? error.message : String(error)}`);
    }
};

// Common function to format responses
const formatResponse = (data: any) => ({
    content: [{
        type: "text" as const,
        text: JSON.stringify(data, null, 2)
    }]
});

// Common function to handle errors
const handleError = (error: unknown) => ({
    content: [{
        type: "text" as const,
        text: `An error occurred: ${error instanceof Error ? error.message : String(error)}`
    }]
});

// Create an MCP server
const server = new McpServer({
    name: "Toggl MCP Server - Bamboo Team Edition",
    version: "1.0.0"
});

// Tool to get time entries (uses API token from environment variable)
server.tool("get_time_entries",
    {
        startDate: z.string().optional().describe('Start date/time (ISO 8601 format, e.g., 2024-04-08T00:00:00Z)'),
        endDate: z.string().optional().describe('End date/time (ISO 8601 format, e.g., 2024-04-14T23:59:59Z)'),
        before: z.string().optional().describe('Get entries before this date/time (ISO 8601 format)'),
        since: z.number().optional().describe('Get entries since this UNIX timestamp')
    },
    async ({ startDate, endDate, before, since }, extra) => {
        try {
            // Date format validation
            if (startDate && !isValidISODate(startDate)) {
                throw new Error('startDate is in invalid ISO 8601 format');
            }
            if (endDate && !isValidISODate(endDate)) {
                throw new Error('endDate is in invalid ISO 8601 format');
            }
            if (before && !isValidISODate(before)) {
                throw new Error('before is in invalid ISO 8601 format');
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

// Function to validate ISO 8601 date format
function isValidISODate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString.includes('T');
}

// Tool to get currently running time entry
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

// Tool to create a time entry
server.tool("create_time_entry",
    {
        workspaceId: z.number().describe('Workspace ID'),
        description: z.string().optional().describe('Time entry description'),
        projectId: z.number().optional().describe('Project ID'),
        taskId: z.number().optional().describe('Task ID'),
        billable: z.boolean().optional().describe('Whether the entry is billable'),
        start: z.string().describe('Start time (ISO 8601 format)'),
        stop: z.string().optional().describe('Stop time (ISO 8601 format)'),
        duration: z.number().optional().describe('Duration in seconds (0 for start/stop times)'),
        tags: z.array(z.string()).optional().describe('List of tags')
    },
    async ({ workspaceId, description, projectId, taskId, billable, start, stop, duration, tags }, extra) => {
        try {
            const url = `${TOGGL_API_URL}/time_entries?meta=true`;
            // Calculate duration if not provided
            const calculatedDuration = duration !== undefined ? duration : 
                (stop ? Math.floor((new Date(stop).getTime() - new Date(start).getTime()) / 1000) : 0);
            
            const data = await executeApiRequest(url, "POST", {
                created_with: "MCP-Bamboo-Team",
                pid: projectId,
                tid: null,
                description: description || "",
                tags: tags || [],
                billable: billable || false,
                duration: calculatedDuration,
                groupBy: "",
                wid: workspaceId,
                start,
                stop: stop || start
            });
            return formatResponse(data);
        } catch (error) {
            return handleError(error);
        }
    }
);

// Tool to bulk edit time entries
server.tool("bulk_edit_time_entries",
    {
        workspaceId: z.number().describe('Workspace ID'),
        timeEntryIds: z.array(z.number()).describe('Array of time entry IDs to edit'),
        projectId: z.number().optional().describe('New project ID'),
        taskId: z.number().optional().describe('New task ID'),
        tags: z.array(z.string()).optional().describe('New tags'),
        billable: z.boolean().optional().describe('New billable status')
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

// Tool to update a time entry
server.tool("update_time_entry",
    {
        workspaceId: z.number().describe('Workspace ID'),
        timeEntryId: z.number().describe('Time entry ID to update'),
        description: z.string().optional().describe('New description'),
        projectId: z.number().optional().describe('New project ID'),
        taskId: z.number().optional().describe('New task ID'),
        billable: z.boolean().optional().describe('New billable status'),
        start: z.string().optional().describe('New start time (ISO 8601 format)'),
        duration: z.number().optional().describe('New duration in seconds'),
        tags: z.array(z.string()).optional().describe('New tags')
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

// Tool to delete a time entry
server.tool("delete_time_entry",
    {
        workspaceId: z.number().describe('Workspace ID'),
        timeEntryId: z.number().describe('Time entry ID to delete')
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

// Tool to stop a running time entry
server.tool("stop_time_entry",
    {
        workspaceId: z.number().describe('Workspace ID'),
        timeEntryId: z.number().describe('Time entry ID to stop')
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

// Tool to get list of workspaces
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

// Tool to get list of projects in a workspace
server.tool("get_workspace_projects",
    {
        workspaceId: z.number().describe('Workspace ID'),
        active: z.boolean().optional().describe('Get only active projects'), 
        page: z.number().optional().describe('Page number (for pagination)'), 
        perPage: z.number().optional().describe('Number of items per page')
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

// Tool to find a project by name in a workspace
server.tool("find_project_by_name",
    {
        workspaceId: z.number().describe('Workspace ID'),
        projectName: z.string().describe('Name of the project to find')
    },
    async ({ workspaceId, projectName }, extra) => {
        try {
            const url = `${TOGGL_API_URL}/workspaces/${workspaceId}/projects`;
            const projects = await executeApiRequest<any[]>(url, "GET");
            
            const project = projects.find(p => p.name === projectName);
            if (!project) {
                throw new Error(`Project "${projectName}" not found in workspace ${workspaceId}`);
            }
            
            return formatResponse(project);
        } catch (error) {
            return handleError(error);
        }
    }
);

// Tool to bulk create time entries from JSON data
server.tool("bulk_create_time_entries",
    {
        workspaceId: z.number().describe('Workspace ID'),
        entries: z.array(z.object({
            description: z.string().describe('Entry description'),
            start: z.string().describe('Start time in ISO 8601 format'),
            stop: z.string().describe('Stop time in ISO 8601 format'), 
            tags: z.array(z.string()).optional().describe('Array of tags'),
            projectName: z.string().optional().describe('Project name (will be resolved to project ID)'),
            projectId: z.number().optional().describe('Project ID (if known)'),
            billable: z.boolean().optional().describe('Whether entry is billable').default(false)
        })).describe('Array of time entries to create')
    },
    async ({ workspaceId, entries }, extra) => {
        try {
            const results = [];
            let projectCache: Record<string, number> = {};
            
            // Get all projects once to build cache
            const projectsUrl = `${TOGGL_API_URL}/workspaces/${workspaceId}/projects`;
            const projects = await executeApiRequest<any[]>(projectsUrl, "GET");
            projectCache = projects.reduce((acc, project) => {
                acc[project.name] = project.id;
                return acc;
            }, {} as Record<string, number>);

            for (const entry of entries) {
                try {
                    // Resolve project ID if project name is provided
                    let projectId = entry.projectId;
                    if (entry.projectName && !projectId) {
                        projectId = projectCache[entry.projectName];
                        if (!projectId) {
                            throw new Error(`Project "${entry.projectName}" not found`);
                        }
                    }

                    // Calculate duration in seconds
                    const startTime = new Date(entry.start);
                    const stopTime = new Date(entry.stop);
                    const duration = Math.floor((stopTime.getTime() - startTime.getTime()) / 1000);

                    const timeEntryData = {
                        created_with: "MCP-Bamboo-Team",
                        pid: projectId,
                        tid: null,
                        description: entry.description,
                        tags: entry.tags || [],
                        billable: entry.billable || false,
                        duration: duration,
                        groupBy: "",
                        wid: workspaceId,
                        start: entry.start,
                        stop: entry.stop
                    };

                    const url = `${TOGGL_API_URL}/time_entries?meta=true`;
                    const result = await executeApiRequest<any>(url, "POST", timeEntryData);
                    
                    results.push({
                        success: true,
                        entry: entry.description,
                        id: result.id,
                        duration_hours: (duration / 3600).toFixed(2),
                        billable: entry.billable
                    });

                    // Small delay to respect API rate limits (1 req/sec)
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (entryError) {
                    results.push({
                        success: false,
                        entry: entry.description,
                        error: entryError instanceof Error ? entryError.message : String(entryError)
                    });
                }
            }

            return formatResponse({
                total_entries: entries.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                total_billable_hours: results
                    .filter(r => r.success && r.billable)
                    .reduce((sum, r) => sum + parseFloat(r.duration_hours || "0"), 0)
                    .toFixed(2),
                results: results
            });
        } catch (error) {
            return handleError(error);
        }
    }
);

// Tool to get workspace tags
server.tool("get_workspace_tags",
    {
        workspaceId: z.number().describe('Workspace ID')
    },
    async ({ workspaceId }, extra) => {
        try {
            const url = `${TOGGL_API_URL}/workspaces/${workspaceId}/tags`;
            const data = await executeApiRequest(url, "GET");
            return formatResponse(data);
        } catch (error) {
            return handleError(error);
        }
    }
);

// Tool to get user's current workspace information
server.tool("get_me",
    {},
    async (_, extra) => {
        try {
            const url = `${TOGGL_API_URL}/me`;
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
            text: `Hello, ${name}! Welcome to Bamboo Team's Toggl MCP Server.`
        }]
    })
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
