import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { questions } = await request.json();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `你是考研复习规划师，根据题目生成间隔重复复习计划：
今天复习
明天复习
3天后复习
7天后复习
语言简洁清晰`,
      },
      { role: "user", content: questions },
    ],
  });

  return NextResponse.json({
    plan: completion.choices[0].message.content,
  });
}