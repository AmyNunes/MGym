import { coachTurn } from '@/ai/functions/coach';
import { profileContext } from '@/ai/prompts/common';
import { createConversation, latestConversation, saveMessages, type CoachMessage, type Conversation } from '@/db/coachRepo';
import { getActivePlan } from '@/db/plansRepo';
import { allowedCatalog } from '@/features/plan/aiAdjust';
import { nowIso } from '@/lib/dates';
import { useProfile } from '@/stores/profileStore';
import { findExercise } from '@/training/catalog';

/** "Perguntar à IA" (seção 14.3): a conversa fica no aparelho (`coach_conversations`). */

export async function currentConversation(): Promise<Conversation> {
  return (await latestConversation()) ?? createConversation();
}

export async function newConversation(): Promise<Conversation> {
  return createConversation();
}

async function planSummary(): Promise<string> {
  const plan = await getActivePlan();
  if (!plan) return 'Ainda sem plano.';
  return plan.days.map((d) => `${d.name}: ${d.exercises.map((e) => findExercise(e.exerciseId)?.name ?? e.exerciseId).join(', ')}`).join('\n');
}

/**
 * Manda a pergunta e guarda a resposta. A pergunta fica salva mesmo se a IA falhar
 * (dá para "Tentar de novo" sem digitar outra vez).
 */
export async function ask(conversation: Conversation, text: string): Promise<Conversation> {
  const trimmed = text.trim();
  const messages: CoachMessage[] = trimmed ? [...conversation.messages, { role: 'user', text: trimmed, at: nowIso() }] : conversation.messages;
  await saveMessages(conversation.id, messages);
  const profile = useProfile.getState().profile;
  const reply = await coachTurn({
    history: messages.map((m) => ({ role: m.role, text: m.text })),
    context: profileContext(profile),
    planSummary: await planSummary(),
    catalog: allowedCatalog(profile),
  });
  const next: CoachMessage[] = [
    ...messages,
    { role: 'assistant', text: reply.replyPt, suggestedExerciseIds: reply.suggestedExerciseIds, safetyFlag: reply.safetyFlag, at: nowIso() },
  ];
  await saveMessages(conversation.id, next);
  return { ...conversation, messages: next };
}
