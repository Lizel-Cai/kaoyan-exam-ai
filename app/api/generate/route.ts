import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { notes, subject } = await request.json();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  let prompt = "";

  if (subject === "politics") {
    prompt = `你是考研政治命题老师，根据内容生成：
2道单选
2道多选
1道分析题
格式清晰，给参考答案`;
  } else if (subject === "english") {
    prompt = "你是考研英语老师，生成阅读选择题、翻译、写作题，给答案";
  } else {
    prompt = "你是考研专业课老师，生成名词解释、简答、论述，给答案";
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: notes },
    ],
  });

  return NextResponse.json({
    questions: completion.choices[0].message.content,
  });
}