// Shared AI prompt builders for the Blog feature.

export function buildDraftPrompt({ title, topic, tone, tags }) {
  return `You are a blog writing assistant inside the TTT app. Write a complete, well-structured blog post in Markdown for an everyday reader.

Title: ${title || "(suggest a fitting title and use it as the H1)"}
Topic / notes: ${topic || title || "(not specified — pick a relevant, interesting angle)"}
Tone: ${tone || "conversational, informative"}
${tags && tags.length ? `Tags: ${tags.join(", ")}` : ""}

Hard requirements:
- Begin with a single "# " H1 title (the post title).
- 250-500 words, scannable, with 2-4 "## " H2 section headings.
- Include a 1-2 sentence hook intro, 2-3 concrete sections, and a one-line takeaway at the end.
- No placeholders, no "TODO", no meta commentary. Return ONLY the Markdown post.
- Match the language the user wrote in.`;
}

export function buildChatPrompt(blog, history, question) {
  const recent = (history || []).slice(-6);
  let transcript = "";
  for (const m of recent) {
    transcript += m.role === "user" ? `Reader: ${m.content}\n` : `Assistant: ${m.content}\n`;
  }
  transcript += `Reader: ${question}\nAssistant:`;
  return `You are an AI reading companion. A reader is exploring this blog post and asking you about it. Answer using ONLY the blog content below. If the answer is not in the post, say so honestly and offer a related angle from the post. Keep replies short, friendly, and concrete. Answer in the reader's language.

Blog title: ${blog?.title || ""}
Author: ${blog?.author_name || "Anonymous"}
Tags: ${(blog?.tags || []).join(", ")}

Blog content:
"""
${blog?.content || ""}
"""

Conversation so far:
${transcript}`;
}