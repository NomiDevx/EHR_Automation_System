import { NextRequest, NextResponse } from 'next/server';
import { getSessionState, saveSessionState } from '@/lib/agent/engine/store';
import { runAgent } from '@/lib/agent/engine/agent';
import { saveChatLog } from '@/lib/agent/engine/tools';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, message, user_id } = body;

    if (!session_id || !message) {
      return NextResponse.json(
        { error: 'session_id and message are required' },
        { status: 400 },
      );
    }

    // 1. Get or initialize session state
    const state = getSessionState(session_id, user_id);
    if (user_id) state.user_id = user_id;

    // 2. Add user message to conversation history
    state.messages.push({ role: 'user', content: message });

    // Log user message
    await saveChatLog({
      sessionId: session_id,
      senderRole: 'user',
      messageText: message,
      userId: user_id || state.user_id,
      patientId: state.patient_id,
    });

    // 3. Run the LLM-driven agent (tool selection + execution + reply)
    const result = await runAgent(state, message);

    // 4. Add assistant reply to history
    state.messages.push({ role: 'assistant', content: result.reply });
    state.reply = result.reply;
    state.options = result.options;

    // 5. Persist updated state
    saveSessionState(session_id, state);

    // Log agent response
    await saveChatLog({
      sessionId: session_id,
      senderRole: 'agent',
      messageText: result.reply,
      userId: user_id || state.user_id,
      patientId: state.patient_id,
      currentNode: 'LLM_AGENT',
      options: result.options,
    });

    return NextResponse.json({
      reply: result.reply,
      current_node: 'LLM_AGENT',
      options: result.options,
    });
  } catch (err: any) {
    console.error('[API /api/chat Error]:', err);
    return NextResponse.json(
      {
        reply: "I'm sorry, I encountered a temporary problem. Please try again or contact our front desk.",
        current_node: 'ERROR',
        options: ['Try again', 'Call clinic'],
      },
      { status: 500 },
    );
  }
}
