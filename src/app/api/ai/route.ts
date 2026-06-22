import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text content is required for summarization' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Sandbox Simulation Mode (if no Gemini key is configured)
    if (!apiKey || apiKey.startsWith('your-')) {
      console.warn('Gemini API Key is missing. Running in simulated sandbox mode.');
      
      // Simulate network latency for high-fidelity animations
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockBulletSummaries = [
        "🌸 Striving for cognitive clarity by maintaining an organized visual hierarchy in your MindGarden.",
        "💡 Important focus keys captured, encouraging structured workflow and ideas generation.",
        "✨ Gentle reminder to nurture your daily thoughts, reflect on action items, and clear mental clutter."
      ];

      const simulatedSummary = `\n\n---\n✨ **MindGarden AI Summarization (Sandbox Mode)**:\n` + 
        mockBulletSummaries.map(s => `- ${s}`).join('\n');

      return NextResponse.json({ summary: simulatedSummary });
    }

    // Direct Gemini API Call (gemini-2.5-flash)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an elegant AI thinking assistant inside MindGarden, a mindful notes application. Your task is to provide a concise, beautiful, and insightful summary of the user's note. Format your summary as a bulleted list (2-3 bullets) with a calming emoji prefix for each bullet. Keep it concise, professional, and elegant.\n\nPlease summarize the following note content:\n\n${text}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData?.error?.message || 'Gemini API error occurred' }, { status: response.status });
    }

    const data = await response.json();
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No summary returned from Gemini completions');
    }
    const formattedSummary = `\n\n---\n✨ **MindGarden AI Summarization**:\n${generatedText}`;

    return NextResponse.json({ summary: formattedSummary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error occurred during AI processing' }, { status: 500 });
  }
}
