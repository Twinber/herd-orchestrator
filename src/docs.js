// Curated documentation deltas for herdr API methods.
//
// This is a best-effort prose layer ON TOP of the live schema: field types,
// required args and input schemas always come from the exported schema, so the
// shape of the tools can never drift. Methods not listed here fall back to the
// auto-generated description. Entries that reference methods or fields that no
// longer exist are reported by `checkDocCoverage`.

const fields = {
  workspace_id: "Id of the workspace.",
  tab_id: "Id of the tab.",
  pane_id: "Id of the pane.",
  label: "Display label.",
  cwd: "Working directory for the new element.",
  env: "Extra environment variables for the launched process.",
  focus: "Focus the new element after creation.",
};

const DOCS = {
  ping: {
    description: "Ping the herdr server. Returns the server version and protocol.",
  },
  "session.snapshot": {
    description: "Dump the full session snapshot: workspaces, tabs, panes, layouts and agents.",
  },

  "workspace.create": {
    description: "Create a new workspace (a collection of tabs). Returns the workspace, its first tab and root pane.",
    fields: { label: fields.label, cwd: fields.cwd, env: fields.env, focus: fields.focus },
  },
  "workspace.list": {
    description: "List all open workspaces.",
  },
  "workspace.get": {
    description: "Get a single workspace by id.",
    fields: { workspace_id: fields.workspace_id },
  },
  "workspace.focus": {
    description: "Focus a workspace.",
    fields: { workspace_id: fields.workspace_id },
  },
  "workspace.rename": {
    description: "Rename a workspace.",
    fields: { workspace_id: fields.workspace_id, label: fields.label },
  },
  "workspace.move": {
    description: "Reorder a workspace in the workspace list.",
    fields: { workspace_id: fields.workspace_id, insert_index: "Target index (0-based)." },
  },
  "workspace.close": {
    description: "Close a workspace and all its tabs/panes.",
    fields: { workspace_id: fields.workspace_id },
  },
  "workspace.report_metadata": {
    description: "Report display metadata (tokens) for a workspace from an integration.",
    fields: {
      workspace_id: fields.workspace_id,
      source: "Integration/source identifier.",
      tokens: "Key/value metadata tokens (keys match ^[A-Za-z0-9_-]{1,32}$).",
      seq: "Ordering sequence (optional).",
      ttl_ms: "How long the tokens stay valid (1..86400000).",
    },
  },

  "tab.create": {
    description: "Create a new tab in a workspace. Returns the tab and its root pane.",
    fields: {
      label: fields.label,
      cwd: fields.cwd,
      env: fields.env,
      focus: fields.focus,
      workspace_id: "Workspace in which to create the tab.",
    },
  },
  "tab.list": {
    description: "List tabs, optionally filtered to a workspace.",
    fields: { workspace_id: "Only list tabs of this workspace (optional)." },
  },
  "tab.get": {
    description: "Get a single tab by id.",
    fields: { tab_id: fields.tab_id },
  },
  "tab.focus": {
    description: "Focus a tab.",
    fields: { tab_id: fields.tab_id },
  },
  "tab.rename": {
    description: "Rename a tab.",
    fields: { tab_id: fields.tab_id, label: fields.label },
  },
  "tab.move": {
    description: "Reorder a tab in its workspace.",
    fields: { tab_id: fields.tab_id, insert_index: "Target index (0-based)." },
  },
  "tab.close": {
    description: "Close a tab and all its panes.",
    fields: { tab_id: fields.tab_id },
  },

  "pane.split": {
    description: "Split a pane, creating a new pane to the right or below.",
    fields: {
      direction: "Where to place the new pane: right or down.",
      target_pane_id: "Pane to split (defaults to the focused pane).",
      ratio: "Split ratio (0-1).",
      cwd: fields.cwd,
      env: fields.env,
      focus: fields.focus,
      workspace_id: "Workspace of the target pane (optional).",
    },
  },
  "pane.swap": {
    description: "Swap two panes (by id, or by moving focus in a direction).",
    fields: {
      direction: "Swap with the neighbor in this direction.",
      source_pane_id: "First pane to swap.",
      target_pane_id: "Second pane to swap.",
      pane_id: "Pane to swap (alternative to source/target).",
    },
  },
  "pane.move": {
    description: "Move a pane to another tab or to a new tab/workspace.",
    fields: {
      pane_id: fields.pane_id,
      destination: "Where to move: {type:'tab', tab_id, split}, {type:'new_tab'} or {type:'new_workspace'}.",
      focus: "Focus the pane after moving.",
    },
  },
  "pane.zoom": {
    description: "Zoom or unzoom a pane. mode: toggle (default), on, off.",
    fields: { mode: "toggle, on or off.", pane_id: fields.pane_id },
  },
  "pane.layout": {
    description: "Get the layout snapshot (panes, splits, focus) of a tab.",
    fields: { pane_id: "Tab containing the pane (optional, defaults to focused)." },
  },
  "pane.process_info": {
    description: "Inspect the processes running in a pane.",
    fields: { pane_id: fields.pane_id },
  },
  "pane.list": {
    description: "List all panes, optionally filtered to a workspace.",
    fields: { workspace_id: "Only list panes of this workspace (optional)." },
  },
  "pane.current": {
    description: "Get the currently focused pane.",
    fields: { caller_pane_id: "Id of the calling pane (optional)." },
  },
  "pane.get": {
    description: "Get pane info by id.",
    fields: { pane_id: fields.pane_id },
  },
  "pane.focus": {
    description: "Focus a pane.",
    fields: { pane_id: fields.pane_id },
  },
  "pane.rename": {
    description: "Set or clear a pane's display label.",
    fields: { pane_id: fields.pane_id, label: "New label (null to clear)." },
  },
  "pane.read": {
    description: "Read terminal output from a pane.",
    fields: {
      pane_id: fields.pane_id,
      source: "Buffer to read: visible, recent, recent_unwrapped or detection.",
      format: "Output format: text or ansi (keeps ANSI codes).",
      lines: "Maximum number of lines to read (null for all).",
      strip_ansi: "Strip ANSI escape sequences (default true).",
    },
  },
  "pane.send_text": {
    description: "Type literal text into a pane's input (no Enter).",
    fields: { pane_id: fields.pane_id, text: "Literal text to type." },
  },
  "pane.send_keys": {
    description: "Send key presses to a pane, e.g. Enter, Ctrl-C, Down, Backspace.",
    fields: { pane_id: fields.pane_id, keys: "List of key names." },
  },
  "pane.send_input": {
    description: "Send text and/or key presses to a pane in one call.",
    fields: { pane_id: fields.pane_id, text: "Literal text to type.", keys: "List of key names." },
  },
  "pane.close": {
    description: "Close a pane.",
    fields: { pane_id: fields.pane_id },
  },
  "pane.neighbor": {
    description: "Find the pane adjacent to a given pane in a direction.",
    fields: { direction: "left, right, up or down.", pane_id: fields.pane_id },
  },
  "pane.edges": {
    description: "Report, for each direction, whether the pane has a neighbor or sits at an edge.",
    fields: { pane_id: fields.pane_id },
  },
  "pane.focus_direction": {
    description: "Focus the neighbor of a pane in a direction.",
    fields: { direction: "left, right, up or down.", pane_id: fields.pane_id },
  },
  "pane.resize": {
    description: "Resize a split in a direction.",
    fields: { direction: "left, right, up or down.", amount: "Resize amount (optional).", pane_id: fields.pane_id },
  },
  "pane.wait_for_output": {
    description: "Block until the pane output matches a substring or regex, then return the read.",
    fields: {
      pane_id: fields.pane_id,
      source: "Buffer to watch: visible, recent, recent_unwrapped or detection.",
      match: "Match spec: {type:'substring'|'regex', value}.",
      timeout_ms: "How long to wait (null for server default).",
      strip_ansi: "Strip ANSI escape sequences (default true).",
      lines: "Max lines in the returned read.",
    },
  },

  "agent.list": {
    description: "List agents detected running in panes.",
  },
  "agent.get": {
    description: "Get agent info by target.",
    fields: { target: "Agent target (pane id, session id or path)." },
  },
  "agent.read": {
    description: "Read recent output from an agent's terminal.",
    fields: {
      target: "Agent target.",
      source: "Buffer to read: visible, recent, recent_unwrapped or detection.",
      lines: "Maximum number of lines.",
      format: "text or ansi.",
      strip_ansi: "Strip ANSI escape sequences (default true).",
    },
  },
  "agent.prompt": {
    description: "Send a prompt to an agent running in a pane.",
    fields: {
      target: "Agent target.",
      text: "The prompt text.",
      wait: "Optionally block until the agent reaches one of these statuses: idle, working, blocked, done, unknown.",
    },
  },
  "agent.start": {
    description: "Launch an agent in a pane.",
    fields: {
      name: "Agent name.",
      kind: "Agent kind/integration.",
      pane_id: fields.pane_id,
      args: "Extra CLI args.",
      timeout_ms: "Startup timeout (3000..300000 ms).",
    },
  },
  "agent.wait": {
    description: "Wait until an agent reaches one of the given statuses.",
    fields: {
      target: "Agent target.",
      until: "Statuses to wait for: idle, working, blocked, done, unknown.",
      timeout_ms: "How long to wait (null for server default).",
    },
  },
  "agent.send_keys": {
    description: "Send key presses to an agent's terminal.",
    fields: { target: "Agent target.", keys: "List of key names." },
  },
  "agent.focus": {
    description: "Focus an agent's pane.",
    fields: { target: "Agent target." },
  },
  "agent.rename": {
    description: "Set or clear an agent's display name.",
    fields: { target: "Agent target.", name: "New name (null to clear)." },
  },
  "agent.explain": {
    description: "Explain the integration used by an agent.",
    fields: { target: "Agent target." },
  },

  "layout.export": {
    description: "Export the layout (tree of splits and panes) of a tab or pane.",
    fields: { tab_id: "Tab to export (optional).", pane_id: "Pane to export (optional)." },
  },
  "layout.apply": {
    description: "Apply a layout to recreate panes. root is a tree of {type:'pane'} / {type:'split'} nodes.",
    fields: {
      root: "Layout tree: {type:'pane', ...} or {type:'split', direction, ratio, first, second}.",
      workspace_id: "Target workspace (optional).",
      tab_id: "Target tab (optional).",
      tab_label: "Label for a new tab (optional).",
      focus: "Focus the applied layout.",
    },
  },
  "layout.set_split_ratio": {
    description: "Set the ratio of a split identified by a boolean path (left/right or first/second).",
    fields: { path: "Boolean path to the split.", ratio: "New ratio (0-1).", tab_id: "Tab (optional).", pane_id: fields.pane_id },
  },

  "notification.show": {
    description: "Show a notification toast.",
    fields: {
      title: "Notification title.",
      body: "Optional body text.",
      position: "Toast position: top-left, top-right, bottom-left, bottom-right.",
      sound: "Sound: none, done or request.",
    },
  },

  "events.wait": {
    description: "Block until an event matching `match_event` occurs (or timeout).",
    fields: {
      match_event: "Event matcher, e.g. {event:'pane_output_changed', pane_id, min_revision}.",
      timeout_ms: "How long to wait (null for server default).",
    },
  },
  "events.subscribe": {
    description: "Subscribe to event streams (push notifications for workspace/tab/pane changes and layout updates).",
    fields: { subscriptions: "List of subscription descriptors, e.g. {type:'pane.updated'}." },
  },

  "integration.install": {
    description: "Install a herdr agent integration.",
    fields: { target: "Integration id (pi, omp, claude, codex, copilot, opencode, kilo, ...)." },
  },
  "integration.uninstall": {
    description: "Uninstall a herdr agent integration.",
    fields: { target: "Integration id." },
  },

  "worktree.list": {
    description: "List git worktrees for a repository.",
    fields: { cwd: "Directory inside the repo (optional).", workspace_id: "Workspace to scope the search (optional)." },
  },
  "worktree.create": {
    description: "Create a git worktree and open it as a workspace.",
    fields: { path: "Where to create the worktree.", branch: "Branch to use.", base: "Base ref.", cwd: "Repo directory (optional).", workspace_id: "Existing workspace to target (optional).", label: "Workspace label.", focus: fields.focus },
  },
  "worktree.open": {
    description: "Open an existing git worktree as a workspace.",
    fields: { path: "Path to the worktree.", branch: "Branch to check out (optional).", cwd: "Repo directory (optional).", label: "Workspace label.", focus: fields.focus },
  },
  "worktree.remove": {
    description: "Remove a git worktree and close its workspace.",
    fields: { workspace_id: "Workspace of the worktree.", force: "Force removal (default false)." },
  },

  "server.stop": {
    description: "Stop the herdr server.",
  },
  "server.reload_config": {
    description: "Reload the herdr config.toml in the running server.",
  },
  "server.agent_manifests": {
    description: "List the agent manifests known to the server.",
  },
  "server.reload_agent_manifests": {
    description: "Reload agent manifests from disk.",
  },
  "server.live_handoff": {
    description: "Live handoff used during herdr self-update (advanced).",
    fields: { expected_protocol: "Expected protocol version.", expected_version: "Expected version.", import_exe: "Binary to import state from." },
  },

  "plugin.link": {
    description: "Link a plugin directory into the registry.",
    fields: { path: "Plugin path (manifest file or directory).", source: "Optional source info (local/github).", enabled: "Enable on link (default true)." },
  },
  "plugin.list": {
    description: "List linked plugins.",
    fields: { plugin_id: "Filter to a single plugin (optional)." },
  },
  "plugin.unlink": {
    description: "Unlink a plugin.",
    fields: { plugin_id: "Plugin id." },
  },
  "plugin.enable": {
    description: "Enable a plugin.",
    fields: { plugin_id: "Plugin id." },
  },
  "plugin.disable": {
    description: "Disable a plugin.",
    fields: { plugin_id: "Plugin id." },
  },
  "plugin.action.list": {
    description: "List plugin actions.",
    fields: { plugin_id: "Filter to a single plugin (optional)." },
  },
  "plugin.action.invoke": {
    description: "Invoke a plugin action.",
    fields: { action_id: "Action id.", plugin_id: "Plugin id (optional).", context: "Invocation context (focused pane, selected text, ...)." },
  },
  "plugin.log.list": {
    description: "List recent plugin command logs.",
    fields: { plugin_id: "Filter to a single plugin (optional).", limit: "Max number of logs." },
  },

  "popup.close": {
    description: "Close the open plugin popup.",
  },

  "client.window_title.set": {
    description: "Set the client window title.",
    fields: { title: "New window title." },
  },
  "client.window_title.clear": {
    description: "Clear the client window title.",
  },

  "agent.view.set": {
    description: "Set a view over the agent list (which agents are shown, grouped and sorted).",
    fields: {
      source: "Data source for the view: visible, recent, recent_unwrapped or detection.",
      filter: "Nested filter applied to agents (all/any/not/eq/in/exists).",
      sort: "Sort order for the view.",
      label: "Display label for the view.",
    },
  },
  "agent.view.clear": {
    description: "Clear the agent view, resetting to the default.",
    fields: { source: "Data source whose view to clear (optional)." },
  },

  "pane.graphics.set": {
    description: "Render an image (PNG/RGB/RGBA) in a pane. Provide pixel data as base64.",
    fields: {
      pane_id: fields.pane_id,
      format: "Pixel format: png, rgb or rgba.",
      image_width: "Image width in pixels.",
      image_height: "Image height in pixels.",
      data_base64: "Encoded pixel data (required for non-PNG formats).",
      placement: "Where/how to place the image in the grid (optional).",
    },
  },
  "pane.graphics.clear": {
    description: "Clear any rendered graphics from a pane.",
    fields: { pane_id: fields.pane_id },
  },
  "pane.graphics.info": {
    description: "Report what graphics are currently rendered in a pane.",
    fields: { pane_id: fields.pane_id },
  },

  "pane.report_agent": {
    description: "Report an agent's status for a pane (idle/working/blocked/unknown) from an integration.",
    fields: {
      pane_id: fields.pane_id,
      source: "Integration/source identifier.",
      agent: "Agent name/identifier.",
      state: "One of: idle, working, blocked, unknown.",
      seq: "Ordering sequence (optional).",
      message: "Optional status message.",
      agent_session_id: "Optional agent session id.",
      agent_session_path: "Optional agent session path.",
    },
  },
  "pane.report_agent_session": {
    description: "Report the agent session currently running in a pane.",
    fields: {
      pane_id: fields.pane_id,
      source: "Integration/source identifier.",
      agent: "Agent name/identifier.",
      agent_session_id: "Agent session id (optional).",
      agent_session_path: "Agent session path (optional).",
      session_start_source: "How the session started (optional).",
      seq: "Ordering sequence (optional).",
    },
  },
  "pane.report_metadata": {
    description: "Report display metadata (title, state labels, tokens, agent) for a pane from an integration.",
    fields: {
      pane_id: fields.pane_id,
      source: "Integration/source identifier.",
      seq: "Ordering sequence (optional).",
      title: "Display title (optional).",
      agent: "Agent name (optional).",
      display_agent: "Agent to display (optional).",
      clear_title: "Clear the current title.",
      clear_display_agent: "Clear the displayed agent.",
      clear_state_labels: "Clear the state labels.",
      state_labels: "Map of state label -> text.",
      tokens: "Key/value metadata tokens.",
      applies_to_source: "Source the metadata applies to (optional).",
      ttl_ms: "How long the metadata stays valid (1..86400000).",
    },
  },
  "pane.clear_agent_authority": {
    description: "Clear the agent authority for a pane (which source controls agent reporting).",
    fields: { pane_id: fields.pane_id, seq: "Ordering sequence (optional).", source: "Integration/source identifier." },
  },
  "pane.release_agent": {
    description: "Release a pane from an agent that previously claimed it.",
    fields: { pane_id: fields.pane_id, source: "Integration/source identifier.", agent: "Agent name/identifier.", seq: "Ordering sequence (optional)." },
  },

  "plugin.pane.open": {
    description: "Open a plugin pane (entrypoint UI) in the given placement.",
    fields: {
      plugin_id: "Plugin id.",
      entrypoint: "Plugin entrypoint name.",
      placement: "overlay, popup, split, tab or zoomed (optional).",
      direction: "Split direction (right or down) for split placement (optional).",
      target_pane_id: "Pane to attach to (optional).",
      workspace_id: "Workspace id (optional).",
      cwd: fields.cwd,
      env: fields.env,
      focus: "Focus the plugin pane after opening.",
      width: "Width for popup placement (cells or percentage, optional).",
      height: "Height for popup placement (cells or percentage, optional).",
    },
  },
  "plugin.pane.focus": {
    description: "Focus an open plugin pane.",
    fields: { pane_id: fields.pane_id },
  },
  "plugin.pane.close": {
    description: "Close an open plugin pane.",
    fields: { pane_id: fields.pane_id },
  },
};

export default DOCS;

// Compare the curated docs against the live schema and report drift:
// - missing:    methods present in the schema but with no curated docs (fallback)
// - staleDocs:  curated entries for methods no longer in the schema
// - staleFields: curated field docs for fields no longer in the schema params
export function checkDocCoverage(schema) {
  const request = schema.schemas.request;
  const defs = request.$defs || {};
  const variants = request.oneOf || [];

  const methods = new Set(variants.map((v) => v.properties?.method?.const).filter(Boolean));
  const staleDocs = [];
  const missing = [];
  const staleFields = [];

  for (const method of Object.keys(DOCS)) {
    if (!methods.has(method)) staleDocs.push(method);
  }

  for (const method of methods) {
    if (!DOCS[method]) {
      missing.push(method);
      continue;
    }
    const variant = variants.find((v) => v.properties?.method?.const === method);
    const paramsRef = variant?.properties?.params?.$ref;
    const paramsName = paramsRef?.split("/").pop();
    const paramsDef = paramsName ? defs[paramsName] : null;
    const propNames = new Set(Object.keys(paramsDef?.properties || {}));
    const doc = DOCS[method];
    if (doc.fields) {
      for (const f of Object.keys(doc.fields)) {
        if (!propNames.has(f)) staleFields.push(`${method}.${f}`);
      }
    }
  }

  return { missing, staleDocs, staleFields };
}
