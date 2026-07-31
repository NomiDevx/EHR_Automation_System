import { NextRequest, NextResponse } from 'next/server';
import { getSessionState, saveSessionState } from '@/lib/agent/engine/store';
import { routeTurn } from '@/lib/agent/engine/router';
import { processNodeTurn } from '@/lib/agent/engine/nodes';
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

    // 1. Get or initialize state
    const state = getSessionState(session_id, user_id);
    if (user_id) state.user_id = user_id;

    // 2. Append user message to conversation history
    state.messages.push({ role: 'user', content: message });

    // Save user chat log
    await saveChatLog({
      sessionId: session_id,
      senderRole: 'user',
      messageText: message,
      userId: user_id || state.user_id,
      patientId: state.patient_id,
    });

    // 3. Determine target node via 2-layer router
    const targetNode = await routeTurn(state, message);

    // 4. Process node execution
    const { nextState } = await processNodeTurn(targetNode, state, message);

    // Append assistant response to messages
    nextState.messages.push({ role: 'assistant', content: nextState.reply });

    // 5. Persist state
    saveSessionState(session_id, nextState);

    // Save agent chat log
    await saveChatLog({
      sessionId: session_id,
      senderRole: 'agent',
      messageText: nextState.reply,
      userId: user_id || nextState.user_id,
      patientId: nextState.patient_id,
      currentNode: nextState.current_node,
      options: nextState.options,
    });

    return NextResponse.json({
      reply: nextState.reply,
      current_node: nextState.current_node,
      options: nextState.options || [],
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
