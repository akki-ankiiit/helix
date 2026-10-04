import type { Brief, Project, Source, User } from "../../domain/models";
export interface AuthenticationService {
  signIn(email: string, password: string): Promise<User>;
  recover(email: string): Promise<void>;
}
export interface ProjectService {
  list(): Promise<Project[]>;
  create(brief: Brief): Promise<string>;
}
export interface DocumentService {
  extractFixture(): Promise<Source[]>;
}
export interface FormulationService {
  run(projectId: string, stage: string): Promise<void>;
}
export interface AskResponse {
  answer: string;
  citation: string;
  change?: { before: string; after: string; kind: "objective" };
}
export interface AskService {
  ask(prompt: string, project?: Project): Promise<AskResponse>;
}
export interface ReportService {
  workbook(project: Project): void;
  print(project: Project): void;
}
