import type { BuildInPublicPost } from "@/lib/domain";

// The only place that turns a BuildInPublicPost into the exact markdown
// shape docs/plan/PEERLIST-PLAYBOOK.md specifies -- tags/code-fence/Visual
// section are template mechanics, not something worth asking the model to
// get right every time. See docs/plan/PHASE-10-buildinpublic-engine.md.
export function renderBuildInPublicPost(post: BuildInPublicPost, visual: string): string {
  const tags = ["#buildinpublic", "#nucleus2", ...post.tags.map((t) => `#${t.replace(/^#/, "")}`)].join(" ");
  const code = post.codeBlock ? `\n\`\`\`ts\n${post.codeBlock}\n\`\`\`\n` : "";
  return `# ${post.title}\n\n${post.body}\n${code}\n${post.question}\n\n${tags}\n\n---\n\n## Visual\n\n${visual}\n`;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function draftFilename(post: Pick<BuildInPublicPost, "kind" | "title">, today = new Date()): string {
  const date = today.toISOString().slice(0, 10);
  return `${date}-${post.kind}-${slugify(post.title)}.md`;
}
