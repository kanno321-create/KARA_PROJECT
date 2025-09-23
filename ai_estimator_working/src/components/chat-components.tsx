import React, { useState, useRef } from "react";
import { Send, Copy, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
}

export function ChatInput({ 
  value, 
  onChange, 
  onSend, 
  placeholder = "메시지를 입력하세요…(Enter로 전송)", 
  disabled = false,
  multiline = false 
}: ChatInputProps) {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWithFiles();
    }
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
    onSend();
    setAttachedFiles([]);
  };

  return (
    <div className="p-6 bg-[var(--color-bg)]">
      <div className="max-w-4xl mx-auto">
        <div 
          className={`relative bg-[var(--color-surface)] border rounded-[var(--radius-lg)] p-4 transition-colors ${
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

          <div className="flex items-end gap-3">
            {/* File Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors self-end"
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

            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={`
                flex-1 bg-transparent border-none outline-none resize-none
                body-16 text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]
                ${multiline ? 'min-h-[24px] max-h-[96px]' : 'h-6'}
              `}
              rows={1}
            />
            <Button
              onClick={handleSendWithFiles}
              disabled={disabled || (!value.trim() && attachedFiles.length === 0)}
              size="sm"
              className="p-2 h-auto bg-[var(--color-brand)] hover:bg-[var(--color-brand-strong)] self-end"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface UserMessageProps {
  text: string;
  time: string;
}

export function UserMessage({ text, time }: UserMessageProps) {
  return (
    <div className="flex justify-end mb-6">
      <div className="user-bubble">
        <div className="body-16 text-[var(--color-text)] mb-1">
          {text}
        </div>
        <div className="caption-12 text-[var(--color-text-subtle)] text-right">
          {time}
        </div>
      </div>
    </div>
  );
}

interface AIMessageProps {
  text: string;
  hasCodeBlock?: boolean;
}

export function AIMessage({ text, hasCodeBlock = false }: AIMessageProps) {
  return (
    <div className="flex justify-start mb-6">
      <div className="ai-message">
        <div className="body-16 leading-relaxed">
          {hasCodeBlock ? (
            <CodeBlock content={text} />
          ) : (
            <div className="whitespace-pre-wrap">{text}</div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CodeBlockProps {
  content: string;
}

function CodeBlock({ content }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 my-4">
      <Button
        onClick={handleCopy}
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 p-1 h-auto"
      >
        <Copy size={16} />
      </Button>
      <pre className="font-mono caption-12 text-[var(--color-text)] overflow-x-auto">
        <code>{content}</code>
      </pre>
      {copied && (
        <div className="absolute top-2 right-10 caption-12 text-[var(--color-brand)]">
          복사됨!
        </div>
      )}
    </div>
  );
}

interface DateDividerProps {
  label: string;
}

export function DateDivider({ label }: DateDividerProps) {
  return (
    <div className="flex justify-center my-6">
      <Badge 
        variant="secondary" 
        className="bg-[var(--color-surface-2)] text-[var(--color-text-subtle)] caption-12 px-3 py-1 rounded-[var(--radius-sm)]"
      >
        {label}
      </Badge>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-6">
      <div className="bg-[var(--color-surface-2)] rounded-[var(--radius-lg)] px-4 py-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-[var(--color-text-subtle)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-[var(--color-text-subtle)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-[var(--color-text-subtle)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

interface ScrollToTopButtonProps {
  onClick: () => void;
  visible: boolean;
}

export function ScrollToTopButton({ onClick, visible }: ScrollToTopButtonProps) {
  if (!visible) return null;

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-24 right-6 w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg hover:bg-[var(--color-surface-2)] z-10"
      size="sm"
    >
      <ChevronUp size={20} />
    </Button>
  );
}

interface PromptChipProps {
  label: string;
  onClick: () => void;
}

export function PromptChip({ label, onClick }: PromptChipProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="h-8 px-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-2)] body-14"
    >
      {label}
    </Button>
  );
}

// Sample prompt suggestions
export const samplePrompts = [
  "프로젝트 일정을 어떻게 관리해야 할까요?",
  "견적서 작성 시 주의할 점은?",
  "ERP 시스템 사용법을 알려주세요",
  "효율적인 업무 관리 방법",
  "고객 응대 매뉴얼 작성",
  "품질 관리 체크리스트"
];