import { Card, Badge, ProgressBar } from "./ui";
import type { Project } from "@/lib/mock-data";

function ProjectListItem({ project }: { project: Project }) {
  const details = [
    project.users !== undefined ? `${project.users} users` : null,
    project.revenuePerMonth ? `$${project.revenuePerMonth}/mo` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">{project.name}</span>
        <Badge status={project.status} />
      </div>
      {details && (
        <p className="mt-1 text-xs text-muted-foreground">{details}</p>
      )}
      <div className="mt-2">
        <ProgressBar value={project.progress} />
      </div>
    </div>
  );
}

export function ActiveProjectsCard({ projects }: { projects: Project[] }) {
  return (
    <Card className="flex h-full flex-col gap-3">
      <h2 className="font-semibold">Active Projects ({projects.length})</h2>
      <div className="flex flex-col gap-2">
        {projects.map((project) => (
          <ProjectListItem key={project.id} project={project} />
        ))}
      </div>
    </Card>
  );
}
