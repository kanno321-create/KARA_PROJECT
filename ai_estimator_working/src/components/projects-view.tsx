import React from "react";
import { Folder, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";

interface ProjectCardProps {
  name: string;
  lastActivity: string;
  fileCount: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ProjectCard({ name, lastActivity, fileCount, onOpen, onEdit, onDelete }: ProjectCardProps) {
  return (
    <Card className="w-full h-[200px] bg-[var(--color-surface)] border-[var(--color-border)] hover:shadow-lg transition-shadow">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <Folder size={24} className="text-[var(--color-text-subtle)]" />
          <h3 className="body-16 font-medium text-[var(--color-text)] truncate">
            {name}
          </h3>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-1">
          <div className="body-14 text-[var(--color-text-subtle)]">
            파일 {fileCount}개
          </div>
          <div className="body-14 text-[var(--color-text-subtle)]">
            {lastActivity}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button 
          onClick={onOpen}
          className="flex-1 bg-[var(--color-brand)] hover:bg-[var(--color-brand-strong)]"
        >
          열기
        </Button>
        <Button 
          onClick={onEdit}
          variant="outline"
          className="border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
        >
          편집
        </Button>
      </CardFooter>
    </Card>
  );
}

interface ProjectsViewProps {
  onNewProject: () => void;
  onProjectOpen: (projectId: string) => void;
}

export function ProjectsView({ onNewProject, onProjectOpen }: ProjectsViewProps) {
  const projects = [
    {
      id: "1",
      name: "A사 신규 프로젝트",
      lastActivity: "2시간 전",
      fileCount: 12
    },
    {
      id: "2", 
      name: "B사 견적 관리",
      lastActivity: "어제",
      fileCount: 8
    },
    {
      id: "3",
      name: "내부 시스템 개선",
      lastActivity: "3일 전", 
      fileCount: 15
    },
    {
      id: "4",
      name: "분기별 보고서",
      lastActivity: "1주일 전",
      fileCount: 6
    },
    {
      id: "5",
      name: "설비 점검 계획",
      lastActivity: "2주일 전",
      fileCount: 9
    },
    {
      id: "6",
      name: "신제품 개발",
      lastActivity: "1개월 전",
      fileCount: 23
    }
  ];

  return (
    <div className="flex-1 p-6 bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="h1-24 text-[var(--color-text-strong)] font-semibold">
            프로젝트
          </h1>
          <Button 
            onClick={onNewProject}
            className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-strong)] flex items-center gap-2"
          >
            <Plus size={20} />
            새 프로젝트 만들기
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              name={project.name}
              lastActivity={project.lastActivity}
              fileCount={project.fileCount}
              onOpen={() => onProjectOpen(project.id)}
              onEdit={() => console.log("Edit project", project.id)}
              onDelete={() => console.log("Delete project", project.id)}
            />
          ))}
        </div>

        {/* Empty State for New Projects */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-surface-2)] rounded-full mb-4">
            <Folder size={32} className="text-[var(--color-text-subtle)]" />
          </div>
          <h3 className="h2-20 text-[var(--color-text)] mb-2">
            새 프로젝트로 시작하기
          </h3>
          <p className="body-16 text-[var(--color-text-subtle)] mb-4">
            문서를 업로드하거나 메모를 작성하여 프로젝트를 시작하세요.
          </p>
          <Button 
            onClick={onNewProject}
            variant="outline"
            className="border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
          >
            새 프로젝트 시작
          </Button>
        </div>
      </div>
    </div>
  );
}