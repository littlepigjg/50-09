export type Direction = 0 | 1 | 2 | 3;

export const DirectionVectors: Record<Direction, { dx: number; dy: number }> = {
  0: { dx: 0, dy: -1 },
  1: { dx: 1, dy: 0 },
  2: { dx: 0, dy: 1 },
  3: { dx: -1, dy: 0 },
};

export const DirectionNames: Record<Direction, string> = {
  0: '上',
  1: '右',
  2: '下',
  3: '左',
};

export type CellType = 'empty' | 'wall' | 'start' | 'goal' | 'star' | 'pit';

export interface Cell {
  type: CellType;
}

export interface Position {
  x: number;
  y: number;
}

export interface RobotState {
  position: Position;
  direction: Direction;
  stars: Position[];
}

export interface Level {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  width: number;
  height: number;
  grid: CellType[][];
  start: Position;
  startDirection: Direction;
  goal: Position;
  stars: Position[];
  maxBlocks?: number;
  allowedBlocks: BlockType[];
  hint?: string;
}

export type BlockType =
  | 'move'
  | 'turnLeft'
  | 'turnRight'
  | 'loop'
  | 'ifWall'
  | 'ifStar'
  | 'ifEmpty'
  | 'function'
  | 'callFunction';

export interface BlockConfig {
  type: BlockType;
  label: string;
  color: string;
  icon: string;
  description: string;
  category: 'basic' | 'control' | 'condition' | 'function';
  hasChildren?: boolean;
  canRepeat?: boolean;
}

export interface ProgramBlock {
  id: string;
  type: BlockType;
  children?: ProgramBlock[];
  repeatCount?: number;
  functionId?: string;
}

export interface Program {
  main: ProgramBlock[];
  functions: Record<string, ProgramBlock[]>;
}

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'success' | 'failed';

export interface ExecutionState {
  status: ExecutionStatus;
  robot: RobotState;
  collectedStars: Position[];
  currentStep: number;
  totalSteps: number;
  error?: string;
  highlightedBlockId?: string;
}

export interface LevelProgress {
  completed: boolean;
  starsCollected: number;
  bestSteps: number;
}

export type GameMode = 'menu' | 'play' | 'editor' | 'tutorial-menu' | 'tutorial-play' | 'tutorial-editor';

export type EditorTool =
  | 'select'
  | 'wall'
  | 'start'
  | 'goal'
  | 'star'
  | 'pit'
  | 'erase';

export type UnderstandingCheckType =
  | 'usesBlockType'
  | 'minBlockCount'
  | 'maxBlockCount'
  | 'reachesGoal'
  | 'collectsAllStars'
  | 'noSpecificBlock'
  | 'usesLoop'
  | 'usesCondition'
  | 'usesFunction';

export interface UnderstandingCheck {
  id: string;
  type: UnderstandingCheckType;
  description: string;
  blockType?: BlockType;
  count?: number;
  required: boolean;
}

export interface TutorialExampleCode {
  explanation: string;
  blocks: ProgramBlock[];
}

export interface TutorialStep {
  id: string;
  title: string;
  learningObjective: string;
  explanation: string;
  keyConcepts: string[];
  exampleCode?: TutorialExampleCode;
  practiceTask: string;
  checks: UnderstandingCheck[];
  feedbackCorrect?: string;
  feedbackWrong?: string;
}

export interface TutorialLevel {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  category: string;
  estimatedMinutes: number;
  prerequisites: string[];
  steps: TutorialStep[];
  level: Level;
  author?: string;
  createdAt?: number;
}

export type TutorialGameMode = 'menu' | 'play' | 'editor';

export interface TutorialStepProgress {
  stepId: string;
  completed: boolean;
  attempts: number;
  passedChecks: string[];
  failedChecks: string[];
}

export interface TutorialProgress {
  tutorialId: string;
  currentStepIndex: number;
  steps: TutorialStepProgress[];
  completed: boolean;
  startedAt?: number;
  completedAt?: number;
}
