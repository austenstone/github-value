interface LanguageMetrics extends IdeCodeCompletionsShared {
  name: string;
}

interface ModelBase {
  name: string;
  is_custom_model: boolean;
  custom_model_training_date: string | null;
}

export interface CodeModel extends ModelBase, IdeCodeCompletionsShared {
  languages: LanguageMetrics[];
}

export interface ChatModel extends ModelBase, IdeChatShared {
}

interface DotComChatModel extends ModelBase, DotComChatShared {
}

interface PullRequestModel extends ModelBase, DotComPullRequestsShared {
}

interface CodeEditor extends IdeCodeCompletionsShared {
  name: string;
  models: CodeModel[];
}

interface ChatEditor extends IdeChatShared {
  name: string;
  models: ChatModel[];
}

interface Repository extends DotComPullRequestsShared {
  name: string;
  models: PullRequestModel[];
}

export interface IdeCodeCompletionsShared {
  total_engaged_users: number;
  total_code_acceptances: number;
  total_code_lines_accepted: number;
  total_code_lines_suggested: number;
  total_code_suggestions: number;
}
export interface IdeCodeCompletions extends IdeCodeCompletionsShared {
  languages: LanguageMetrics[];
  editors: CodeEditor[];
}

export interface IdeChatShared {
  total_engaged_users: number;
  total_chats: number;
  total_chat_insertion_events?: number;
  total_chat_copy_events?: number;
}
export interface IdeChat extends IdeChatShared {
  total_chats: number;
  total_engaged_users: number;
  editors: ChatEditor[];
}

export interface DotComChatShared {
  total_engaged_users: number;
  total_chats: number;
}
export interface DotComChat extends DotComChatShared {
  models: DotComChatModel[];
}

export interface DotComPullRequestsShared {
  total_engaged_users: number;
  total_pr_summaries_created: number;
}
export interface DotComPullRequests extends DotComPullRequestsShared {
  repositories: Repository[];
}

interface CopilotMetrics {
  date: string;
  total_active_users: number;
  total_engaged_users: number;
  copilot_ide_code_completions: IdeCodeCompletions | null;
  copilot_ide_chat: IdeChat | null;
  copilot_dotcom_chat: DotComChat | null;
  copilot_dotcom_pull_requests: DotComPullRequests | null;
}

export {
  type CopilotMetrics
}