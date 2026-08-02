import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

export async function POST(req: Request) {
  try {
    const { prompt, provider } = await req.json();

    let text = "";

    // 🟡 FALLBACK kalau belum ada API key
    if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        title: "Sample title (no Gemini key)",
        keywords: "sample, keyword, placeholder",
      });
    }

    if (!process.env.OPENAI_API_KEY && provider !== "gemini") {
      return NextResponse.json({
        title: "Sample title (no OpenAI key)",
        keywords: "sample, keyword, placeholder",
      });
    }

    // 🔵 GEMINI
    if (provider === "gemini") {
      const model = genAI.getGenerativeModel({
        model: "gemini-pro",
      });

      const result = await model.generateContent(`
Generate Canva metadata.

Filename: ${prompt}

Return:
Title: ...
Keywords: keyword1, keyword2, keyword3 (10 keywords, cute, pastel, chibi)
      `);

      text = result.response.text();
    }

    // 🟢 OPENAI
    else {
        // ✅ CEK API KEY DULU
        if (!process.env.OPENAI_API_KEY) {
          return NextResponse.json({
            title: "Sample title (no OpenAI key)",
            keywords: "cute, pastel, chibi, kawaii",
          });
        }
      
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `
      Generate Canva metadata.
      
      Filename: ${prompt}
      
      Return:
      Title: ...
      Keywords: keyword1, keyword2, keyword3 (10 keywords, cute style)
              `,
            },
          ],
        });
      
        text = response.choices[0].message.content || "";
      }
    // 🔧 PARSE (lebih aman)
    const titleMatch = text.match(/Title:\s*(.*)/i);
    const keywordMatch = text.match(/Keywords:\s*(.*)/i);

    return NextResponse.json({
      title: titleMatch?.[1]?.trim() || "Untitled",
      keywords: keywordMatch?.[1]?.trim() || "",
    });
  } catch (error) {
    console.error("AI ERROR:", error);

    return NextResponse.json({
      title: "Error fallback title",
      keywords: "error, fallback",
    });
  }
}