import ping from "./ping.js";
import sessionSnapshot from "./session.snapshot.js";
import workspaceList from "./workspace.list.js";
import workspaceGet from "./workspace.get.js";
import tabList from "./tab.list.js";
import tabGet from "./tab.get.js";
import paneList from "./pane.list.js";
import paneGet from "./pane.get.js";
import paneSplit from "./pane.split.js";
import paneSendInput from "./pane.send_input.js";
import paneWaitForOutput from "./pane.wait_for_output.js";
import agentStart from "./agent.start.js";
import agentPrompt from "./agent.prompt.js";
import agentGet from "./agent.get.js";
import agentWait from "./agent.wait.js";
import agentRead from "./agent.read.js";
import agentSendKeys from "./agent.send_keys.js";
import worktreeCreate from "./worktree.create.js";
import worktreeRemove from "./worktree.remove.js";
import worktreeList from "./worktree.list.js";

const ALL_TOOLS = [
  ping,
  sessionSnapshot,
  workspaceList,
  workspaceGet,
  tabList,
  tabGet,
  paneList,
  paneGet,
  paneSplit,
  paneSendInput,
  paneWaitForOutput,
  agentStart,
  agentPrompt,
  agentGet,
  agentWait,
  agentRead,
  agentSendKeys,
  worktreeCreate,
  worktreeRemove,
  worktreeList,
];

export default ALL_TOOLS;
