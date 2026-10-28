export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

/** Funções de IA do app (seção 14.3). Usadas no registro de uso e no cache. */
export type AIFeature =
  | 'testConnection'
  | 'explainExercise'
  | 'mealOptions'
  | 'describeMeal'
  | 'adjustPlan'
  | 'coachTurn'
  | 'weeklySummary';

export type AIConfig = {
  baseUrl: string;
  apiKey: string | null;
  model: string;
  requiresKey: boolean;
  /** Enviar `response_format: json_object`? */
  jsonMode: boolean;
  inputPricePerMillion: number | null;
  outputPricePerMillion: number | null;
  monthlyLimit: number | null;
};

export type AIUsage = { inputTokens: number; outputTokens: number; estimatedCost: number };

export type AIResult<T> = {
  data: T;
  /** Nome do modelo devolvido pelo provedor (ou o configurado). */
  model: string;
  usage: AIUsage;
};

export type CallOptions = {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
};

/** O mínimo de `Response` que o cliente usa (facilita os testes). */
export type HttpResponse = {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
};

export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string; signal: AbortSignal },
) => Promise<HttpResponse>;
