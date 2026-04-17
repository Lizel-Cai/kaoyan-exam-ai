import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { questions, answer } = await request.json();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "你是考研阅卷老师，逐题批改，指出对错、得分点、遗漏",
      },
      { role: "user", content: `题目：${questions}\n学生答案：${answer}` },
    ],
  });

  return NextResponse.json({
    correction: completion.choices[0].message.content,
  });
}