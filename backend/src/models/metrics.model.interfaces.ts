// Core metrics interfaces 📊
interface LanguageMetrics {
  name: string;
  total_engaged_users: number;
  total_code_suggestions?: number;
  total_code_acceptances?: number;
  total_code_lines_suggested?: number;
  total_code_lines_accepted?: number;
}

interface ModelBase {
  name: string;
  is_custom_model: boolean;
  custom_model_training_date: string | null;
  total_engaged_users: number;
}

interface CodeModel extends ModelBase {
  languages: LanguageMetrics[];
}

interface ChatModel extends ModelBase {
  total_chats: number;
  total_chat_insertion_events?: number;
  total_chat_copy_events?: number;
}

interface DotComChatModel extends ModelBase {
  total_chats: number;
}

interface PullRequestModel extends ModelBase {
  total_pr_summaries_created: number;
}

// Editor and repository interfaces 🖥️
interface Editor {
  name: string;
  total_engaged_users: number;
  models: (CodeModel | ChatModel)[];
}

interface Repository {
  name: string;
  total_engaged_users: number;
  models: PullRequestModel[];
}

// Feature-specific interfaces 🚀
interface IdeCodeCompletions {
  total_engaged_users: number;
  languages: LanguageMetrics[];
  editors: Editor[];
}

interface IdeChat {
  total_engaged_users: number;
  editors: Editor[];
}

interface DotComChat {
  total_engaged_users: number;
  models: DotComChatModel[];
}

interface DotComPullRequests {
  total_engaged_users: number;
  repositories: Repository[];
}

// Main metrics interface 📈
interface CopilotMetrics {
  date: string;
  total_active_users: number;
  total_engaged_users: number;
  copilot_ide_code_completions: IdeCodeCompletions | null;
  copilot_ide_chat: IdeChat | null;
  copilot_dotcom_chat: DotComChat | null;
  copilot_dotcom_pull_requests: DotComPullRequests | null;
}

type CopilotMetricsArray = CopilotMetrics[];

export {
  CopilotMetrics,
  ChatModel,
  CodeModel,
}