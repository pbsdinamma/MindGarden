import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text content is required for summarization' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // Sandbox Simulation Mode (if no OpenAI key is configured)
    if (!apiKey || apiKey.startsWith('your-')) {
      console.warn('OpenAI API Key is missing. Running in simulated sandbox mode.');
      
      // Simulate network latency for high-fidelity animations
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockBulletSummaries = [
        "🌸 Striving for cognitive clarity by maintaining a organized visual hierarchy in your MindGarden.",
        "💡 Important focus keys captured, encouraging structured workflow and ideas generation.",
        "✨ Gentle reminder to nurture your daily thoughts, reflect on action items, and clear mental clutter."
      ];

      const simulatedSummary = `\n\n---\n✨ **MindGarden AI Summarization (Sandbox Mode)**:\n` + 
        mockBulletSummaries.map(s => `- ${s}`).join('\n');

      return NextResponse.json({ summary: simulatedSummary });
    }

    // Direct OpenAI API Call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an elegant AI thinking assistant inside MindGarden, a mindful notes application. Your task is to provide a concise, beautiful, and insightful summary of the user\'s note. Format your summary as a bulleted list (2-3 bullets) with a calming emoji prefix for each bullet. Keep it concise, professional, and elegant.',
          },
          {
            role: 'user',
            content: `Please summarize the following note content:\n\n${text}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 250,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData?.error?.message || 'OpenAI API error occurred' }, { status: response.status });
    }

    const data = await response.json();
    const generatedText = data?.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No summary returned from OpenAI completions');
    }

    const formattedSummary = `\n\n---\n✨ **MindGarden AI Summarization**:\n${generatedText}`;

    return NextResponse.json({ summary: formattedSummary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error occurred during AI processing' }, { status: 500 });
  }
}
