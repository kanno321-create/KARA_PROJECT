import React, { useState, useEffect } from "react";
import { X, Download, FileText, Image, FileSpreadsheet, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { motion, AnimatePresence } from "motion/react";

export interface WorkContent {
  id: string;
  type: 'quote' | 'document' | 'image' | 'spreadsheet' | 'analysis';
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  content?: string;
  downloadUrl?: string;
  createdAt: string;
  progress?: number;
}

interface WorkPanelProps {
  isOpen: boolean;
  onClose: () => void;
  workContent: WorkContent[];
  onDownload: (contentId: string) => void;
  onDownloadAll: () => void;
  currentWork?: WorkContent;
}

const getStatusColor = (status: WorkContent['status']) => {
  switch (status) {
    case 'pending': return 'bg-yellow-500';
    case 'processing': return 'bg-blue-500';
    case 'completed': return 'bg-green-500';
    case 'error': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getStatusText = (status: WorkContent['status']) => {
  switch (status) {
    case 'pending': return '대기 중';
    case 'processing': return '처리 중';
    case 'completed': return '완료';
    case 'error': return '오류';
    default: return '알 수 없음';
  }
};

const getIcon = (type: WorkContent['type']) => {
  switch (type) {
    case 'quote': return <FileSpreadsheet size={16} />;
    case 'document': return <FileText size={16} />;
    case 'image': return <Image size={16} />;
    case 'spreadsheet': return <FileSpreadsheet size={16} />;
    case 'analysis': return <FileText size={16} />;
    default: return <FileText size={16} />;
  }
};

export function WorkPanel({ 
  isOpen, 
  onClose, 
  workContent, 
  onDownload, 
  onDownloadAll,
  currentWork 
}: WorkPanelProps) {
  const [localContent, setLocalContent] = useState<WorkContent[]>(workContent);

  useEffect(() => {
    setLocalContent(workContent);
  }, [workContent]);

  const completedContent = localContent.filter(item => item.status === 'completed');
  const hasContent = completedContent.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="h-full bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="h2-20 text-[var(--color-text-strong)]">작업 공간</h2>
              {currentWork && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(currentWork.status)}`} />
                  {getStatusText(currentWork.status)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasContent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownloadAll}
                  className="body-14"
                >
                  <Download size={14} className="mr-1" />
                  전체 다운로드
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          {/* Current Work Progress */}
          {currentWork && currentWork.status === 'processing' && (
            <div className="p-4 border-b border-[var(--color-border)]">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <RefreshCw size={16} className="text-blue-500 animate-spin" />
                  <span className="body-14 text-[var(--color-text-strong)]">{currentWork.title}</span>
                </div>
                <div className="w-full bg-[var(--color-surface-2)] rounded-full h-2">
                  <motion.div
                    className="bg-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentWork.progress || 0}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="caption-12 text-[var(--color-text-subtle)] mt-2">
                  {currentWork.progress || 0}% 완료
                </p>
              </Card>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {localContent.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <div className="w-16 h-16 bg-[var(--color-surface-2)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={24} className="text-[var(--color-text-subtle)]" />
                  </div>
                  <p className="body-16 text-[var(--color-text-subtle)] mb-2">작업 결과가 없습니다</p>
                  <p className="caption-12 text-[var(--color-text-subtle)]">
                    견적 요청이나 AI 작업을 시작하면<br />
                    결과물이 여기에 표시됩니다
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {localContent.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="p-4 hover:bg-[var(--color-surface-2)] transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="body-14 text-[var(--color-text-strong)] mb-1">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`} />
                              <span className="caption-12 text-[var(--color-text-subtle)]">
                                {getStatusText(item.status)}
                              </span>
                              <span className="caption-12 text-[var(--color-text-subtle)]">
                                {item.createdAt}
                              </span>
                            </div>
                            {item.content && (
                              <p className="caption-12 text-[var(--color-text-subtle)] line-clamp-2">
                                {item.content}
                              </p>
                            )}
                          </div>
                        </div>
                        {item.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownload(item.id)}
                            className="p-2 ml-2"
                          >
                            <Download size={14} />
                          </Button>
                        )}
                      </div>
                      
                      {item.status === 'processing' && item.progress !== undefined && (
                        <div className="mt-3">
                          <div className="w-full bg-[var(--color-surface-2)] rounded-full h-1">
                            <motion.div
                              className="bg-blue-500 h-1 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {hasContent && (
            <div className="p-4 border-t border-[var(--color-border)]">
              <p className="caption-12 text-[var(--color-text-subtle)] text-center">
                총 {completedContent.length}개의 작업물이 완료되었습니다
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast notification component for work completion
export function WorkNotification({ 
  isVisible, 
  message, 
  onClose 
}: { 
  isVisible: boolean; 
  message: string; 
  onClose: () => void; 
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Card className="p-4 shadow-lg border border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-green-500" />
              <div>
                <p className="body-14 text-[var(--color-text-strong)]">작업 완료</p>
                <p className="caption-12 text-[var(--color-text-subtle)]">{message}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}