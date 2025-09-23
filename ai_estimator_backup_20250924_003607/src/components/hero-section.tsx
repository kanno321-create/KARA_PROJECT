import React, { useState, useRef } from "react";
import { ChatInput, PromptChip, samplePrompts } from "./chat-components";

interface HeroSectionProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
}

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

export function HeroSection({ inputValue, onInputChange, onSend }: HeroSectionProps) {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePromptClick = (prompt: string) => {
    onInputChange(prompt);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/gif'
      ];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });

    const newFiles = validFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendWithFiles = () => {
    // Here you would typically handle both text and files
    // For now, we'll just call the original onSend
    onSend();
    
    // Clear attached files after sending
    setAttachedFiles([]);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo and Title */}
        <div className="space-y-2">
          <h1 className="text-[50px] leading-[59px] text-[var(--color-text-strong)] font-semibold -translate-y-[10px]">
            (주)한국산업
          </h1>
          <p className="body-16 text-[var(--color-text-subtle)] text-[20px]">
            무엇을 도와드릴까요?
          </p>
        </div>

        {/* Main Input */}
        <div className="relative">
          <div 
            className={`bg-[var(--color-surface)] border rounded-[var(--radius-lg)] p-4 transition-colors ${
              isDragOver ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/5' : 'border-[var(--color-border)]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* File Upload Area */}
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-brand)]/10 rounded-[var(--radius-lg)] pointer-events-none">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-[var(--color-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-[var(--color-brand)]">파일을 여기에 놓으세요</p>
                </div>
              </div>
            )}

            {/* Attached Files */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 bg-[var(--color-surface-2)] px-3 py-2 rounded-lg"
                  >
                    <svg className="w-4 h-4 text-[var(--color-text-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="body-14 text-[var(--color-text)]">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-[var(--color-text-subtle)] hover:text-[var(--color-error)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* File Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
                title="파일 첨부"
              >
                <svg className="w-5 h-5 text-[var(--color-text-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
              />

              <input
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="메시지를 입력하세요…(Enter로 전송)"
                className="flex-1 bg-transparent border-none outline-none body-16 text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendWithFiles();
                  }
                }}
              />
              <button
                onClick={handleSendWithFiles}
                disabled={!inputValue.trim() && attachedFiles.length === 0}
                className="p-2 rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-strong)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Sample Prompts */}
        <div className="space-y-4">
          <div className="flex flex-wrap justify-center gap-2">
            {samplePrompts.slice(0, 6).map((prompt, index) => (
              <PromptChip 
                key={index}
                label={prompt}
                onClick={() => handlePromptClick(prompt)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}