"use client";

import { useState } from "react";
import Papa from "papaparse";

type FileItem = {
  name: string;
  raw: string;
  title?: string;
  keywords?: string;
};

export default function PreviewSVG() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);

  // 🟢 HANDLE SVG DROP
  const handleDropSVG = async (e: React.DragEvent) => {
    e.preventDefault();

    const dropped = Array.from(e.dataTransfer.files);

    const results = await Promise.all(
      dropped.map(async (file) => {
        const text = await file.text();

        return {
          name: file.name,
          raw: text,
        };
      })
    );

    setFiles(results);
  };

  // 🟡 HANDLE CSV DROP
  const handleDropCSV = async (e: React.DragEvent) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const text = await file.text();

    const parsed = Papa.parse(text, {
      header: true,
    });

    setCsvData(parsed.data as any[]);
  };

  // 🔵 MATCH CSV → SVG
  const getMeta = (file: FileItem) => {
    const cleanName = file.name.replace(/\.[^/.]+$/, "");

    const match = csvData.find((c) => {
      return (
        c.filename === file.name ||
        c.file_name === file.name ||
        c.Filename === file.name ||
        c.fileName === cleanName
      );
    });

    return {
      title:
        match?.title ||
        match?.Title ||
        match?.elementName ||
        "",

      keywords:
        match?.keywords ||
        match?.Keywords ||
        match?.tags ||
        "",
    };
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        SVG Metadata Preview
      </h1>

      {/* DROP SVG */}
      <div
        className="border-2 border-dashed p-6 rounded mb-4 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropSVG}
      >
        Drag & Drop SVG files here
      </div>

      {/* DROP CSV */}
      <div
        className="border-2 border-dashed p-6 rounded mb-6 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropCSV}
      >
        Drag & Drop CSV metadata here
      </div>

      {/* LIST */}
      <div className="grid grid-cols-5 gap-2">
        {files.map((file, i) => {
          const meta = getMeta(file);

          return (
            
           <div key={i} className="border p-2 rounded text-xs">
              <p className="text-xs text-gray-500 mb-2">
                {file.name}
              </p>

              {/* SVG */}
              <div
                className="w-full h-32 flex items-center justify-center overflow-hidden [&>svg]:w-32 [&>svg]:h-32"
                dangerouslySetInnerHTML={{
                  __html: file.raw,
                }}
              />

              {/* TITLE */}
              <p className="text-xs mt-2 text-gray-500">
                Title
              </p>
              <p className="text-sm">{meta.title || "-"}</p>

              <button
                onClick={() =>
                  navigator.clipboard.writeText(meta.title)
                }
                className="text-xs text-blue-500 mt-1"
              >
                Copy Title
              </button>

              {/* KEYWORDS */}
              <p className="text-xs mt-2 text-gray-500">
                Keywords
              </p>
              <p className="text-sm">{meta.keywords || "-"}</p>

              <button
                onClick={() =>
                  navigator.clipboard.writeText(meta.keywords)
                }
                className="text-xs text-blue-500 mt-1"
              >
                Copy Keywords
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}