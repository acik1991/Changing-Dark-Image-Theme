
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';

const App: React.FC = () => {
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (base64: string) => {
    setInputImage(base64);
    setOutputImage(null);
    setError(null);
  };

  const transformImage = async () => {
    if (!inputImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // Extract pure base64 data and mime type
      const mimeType = inputImage.split(';')[0].split(':')[1];
      const base64Data = inputImage.split(',')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: "Please transform this image to have a clean, solid white background and change all text, symbols, and foreground elements to solid black. Ensure high contrast and maintain the original layout and proportions. The result should look professional, like a scanned document or a high-quality print-ready version.",
            },
          ],
        },
      });

      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setOutputImage(`data:image/png;base64,${part.inlineData.data}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        throw new Error("The model did not return a transformed image. Please try again.");
      }
    } catch (err: any) {
      console.error("Transformation Error:", err);
      setError(err.message || "An unexpected error occurred during the transformation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Image <span className="text-blue-600">Transformer</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Convert dark-mode equations, screenshots, or sketches into high-contrast black and white images. 
          Perfect for printing or clean documentation.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <section className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">1</span>
              Upload Input
            </h2>
            <ImageUploader onUpload={handleImageUpload} />
          </div>

          {inputImage && (
            <button
              onClick={transformImage}
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-3 ${
                isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Transforming...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Apply Transformation
                </>
              )}
            </button>
          )}
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 min-h-[400px]">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 text-sm font-bold">2</span>
            Result
          </h2>
          <ResultDisplay 
            output={outputImage} 
            loading={isLoading} 
            error={error}
          />
        </section>
      </div>

      <footer className="mt-16 text-center text-gray-400 text-sm">
        Powered by Gemini 2.5 Flash Image Model
      </footer>
    </div>
  );
};

export default App;
