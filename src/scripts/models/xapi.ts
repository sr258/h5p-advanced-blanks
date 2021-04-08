export class XAPIActivityDefinition {
  name: any;
  description: any;
  type: string;
  interactionType: "true-false" | "choice" | "fill-in" | "long-fill-in" | "matching" | "performance" | "sequencing" | "likert" | "numeric" | "other";
  correctResponsesPattern?: string[];
  extensions: any;
}
