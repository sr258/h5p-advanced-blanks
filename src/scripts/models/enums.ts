export enum MessageType {
  Error,
  Correct,
  Retry,
  None
}

export enum ClozeType {
  Type,
  Select
}

export enum Evaluation {
  ExactMatch,
  CloseMatch,
  NoMatch
}