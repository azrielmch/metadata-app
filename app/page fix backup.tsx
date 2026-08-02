"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";

type Item = {
  file: File;
  preview: string;
  title: string;
  keywords: string;
};

const formatKeywords = (value: string) => {
  // pisah berdasarkan koma
  const keywords = value
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k !== "");

  // remove duplicate
  const unique = Array.from(new Set(keywords));

  return unique.join(", ");
};

const countKeywords = (value: string) => {
  return value
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k !== "").length;
};

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  
  const importCSV = (file: File) => {
    const normalize = (name: string) =>
      name
        .toLowerCase()
        .replace(/\.[^/.]+$/, "") // hapus ekstensi
        .trim();

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];

        const updated = items.map((item) => {
          const match = data.find(
            (row) =>
              normalize(row.filename || "") ===
              normalize(item.file.name)
          );

          if (match) {
            return {
              ...item,
              title: match.title || item.title,
              keywords: match.keywords || item.keywords,
            };
          }

          return item;
        });

        setItems(updated);
      },
    });
  };

  const [marketplace, setMarketplace] = useState("canva");
  const [aiProvider, setAiProvider] = useState("openai");

  const onDrop = (acceptedFiles: File[]) => {
    const newItems = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      title: file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " "),
      keywords: "",
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const updateItem = (
    index: number,
    field: "title" | "keywords",
    value: string
  ) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const exportCSV = () => {
    let csvData: any[] = [];
  
    if (marketplace === "canva") {
      csvData = items.map((item) => ({
        filename: item.file.name,
        title: item.title,
        keywords: item.keywords,
        Artist: "mchlabs",
        locale: "en",
        description: item.title,
      }));
    } else if (marketplace === "freepik") {
      csvData = items.map((item) => ({
        file_name: item.file.name,
        title: item.title,
        tags: item.keywords,
      }));
    } else if (marketplace === "adobe") {
      csvData = items.map((item) => ({
        Filename: item.file.name,
        Title: item.title,
        Keywords: item.keywords,
        Category: "",
        Releases: "",
      }));
    } else if (marketplace === "miricanvas") {
      csvData = items.map((item) => ({
        fileName: item.file.name.replace(/\.[^/.]+$/, ""), // tanpa ekstensi
        elementName: item.title,
        keywords: item.keywords,
        tier: "Premium",
        contentType: "SVGelement",
      }));
    }
  
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
  
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${marketplace}-metadata.csv`;
    link.click();
  };

  const getKeywordsArray = (value?: string) => {
    if (!value) return [];
  
    return value
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k !== "");
  };
  
  const addKeyword = (index: number, keyword: string) => {
    if (!keyword.trim()) return;
  
    const updated = [...items];
    const current = getKeywordsArray(updated[index].keywords);
  
    if (!current.includes(keyword.trim())) {
      current.push(keyword.trim());
    }
  
    updated[index].keywords = current.join(", ");
    setItems(updated);
  };
  
  const removeKeyword = (index: number, keyword: string) => {
    const updated = [...items];
  
    const filtered = getKeywordsArray(updated[index].keywords).filter(
      (k) => k !== keyword
    );
  
    updated[index].keywords = filtered.join(", ");
    setItems(updated);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
  <div className="max-w-7xl mx-auto">
  <div className="mb-6">
  <h1 className="text-3xl font-bold mb-1">
    Metadata Tool Mchlabs
  </h1>
  <p className="text-gray-500 text-sm">
    Generate & manage metadata for your elements
  </p>
  </div>
</div>

      {/* Upload */}
      <div
        {...getRootProps()}
        className="border-2 border-dashed p-10 text-center cursor-pointer mb-6"
      >
        <input {...getInputProps()} />
        <p>Drag & drop images here, or click</p>
      </div>

      {/* Upload csv */}
            <div className="mb-4">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importCSV(file);
          }}
          className="border p-2"
        />
        <p className="text-xs text-gray-500 mt-1">
          Import CSV (filename, title, keywords)
        </p>
      </div>

{/* AI */}
      <div className="mb-4">
  <label className="mr-2 font-medium">AI Beta:</label>
  <select
    value={aiProvider}
    onChange={(e) => setAiProvider(e.target.value)}
    className="border p-2"
  >
    <option value="openai">OpenAI</option>
    <option value="gemini">Gemini</option>
  </select>
</div>

      {/* Bulk Keyword */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Add keyword to all"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const value = (e.target as HTMLInputElement).value;

              const updated = items.map((item) => {
                const combined = item.keywords
                  ? item.keywords + ", " + value
                  : value;
              
                return {
                  ...item,
                  keywords: formatKeywords(combined),
                };
              });

              setItems(updated);
              (e.target as HTMLInputElement).value = "";
            }
          }}
          className="border p-2 w-full"
        />
      </div>


      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
{items.map((item, index) => (
  <div
    key={index}
    className="bg-white rounded-xl shadow-sm p-3 hover:shadow-md transition"
  >
    {/* Image */}
    <div className="bg-gray-100 rounded-lg mb-2 flex items-center justify-center h-32">
      <img
        src={item.preview}
        alt=""
        className="max-h-full object-contain"
      />
    </div>

    {/* Actions */}
    <div className="flex justify-between mb-2">
      <button
        onClick={() =>
          setItems(items.filter((_, i) => i !== index))
        }
        className="text-red-400 text-xs"
      >
        Remove
      </button>

      <button
        onClick={async () => {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: item.file.name,
              provider: aiProvider,
            }),
          });

          const data = await res.json();

          updateItem(index, "title", data.title || "");
          updateItem(index, "keywords", data.keywords || "");
        }}
        className="text-blue-500 text-xs"
      >
        AI
      </button>
    </div>

    {/* Title */}
    <input
      type="text"
      value={item.title}
      onChange={(e) =>
        updateItem(index, "title", e.target.value)
      }
      className="w-full border rounded p-1 text-sm mb-2"
    />

    {/* Keywords (FIXED) */}
    <div className="border rounded p-2 flex flex-wrap gap-1">
      {getKeywordsArray(item.keywords).map((kw, i) => (
        <span
          key={i}
          className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs flex items-center gap-1"
        >
          {kw}
          <button
            onClick={() => removeKeyword(index, kw)}
            className="text-blue-400 hover:text-red-500"
          >
            ✕
          </button>
        </span>
      ))}

      <input
        type="text"
        placeholder="add keyword"
        className="flex-1 text-sm outline-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addKeyword(index, e.currentTarget.value);
            e.currentTarget.value = "";
          }
        }}
      />
    </div>

    {/* Counter */}
    <p className="text-xs mt-1 text-gray-500">
      {countKeywords(item.keywords || "")} keywords
    </p>
  </div>
))}   
      </div>
           {/* Export */}
           <div className="flex flex-col items-start gap-2 mb-2 mt-5">
  <select
    value={marketplace}
    onChange={(e) => setMarketplace(e.target.value)}
    className="border p-2 text-sm"
  >
    <option value="canva">Canva</option>
    <option value="freepik">Freepik</option>
    <option value="adobe">Adobe</option>
    <option value="miricanvas">Miricanvas</option>
  </select>

  <button
    onClick={exportCSV}
    className="mt-2 bg-black text-white px-4 py-2 rounded"
  >
    Export CSV
  </button>
</div>
      </main>
  );
}