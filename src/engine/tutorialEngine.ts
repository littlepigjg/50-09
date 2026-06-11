import type {
  Program,
  ProgramBlock,
  Level,
  TutorialStep,
  UnderstandingCheck,
  TutorialLevel,
  ExecutionState,
} from './types';
import { generateExecutionPlan, createInitialExecutionState } from './GameEngine';

export interface CheckResult {
  checkId: string;
  passed: boolean;
  description: string;
  message: string;
}

export interface StepValidationResult {
  allPassed: boolean;
  results: CheckResult[];
  passedCount: number;
  totalCount: number;
  executionState?: ExecutionState;
}

function collectAllBlocks(
  blocks: ProgramBlock[],
  functions: Record<string, ProgramBlock[]> = {},
  depth: number = 0
): ProgramBlock[] {
  if (depth > 100) return [];
  const all: ProgramBlock[] = [];
  for (const block of blocks) {
    all.push(block);
    if (block.children) {
      all.push(...collectAllBlocks(block.children, functions, depth + 1));
    }
    if (block.type === 'callFunction' && block.functionId && functions[block.functionId]) {
      all.push(...collectAllBlocks(functions[block.functionId], functions, depth + 1));
    }
  }
  return all;
}

function runCheck(
  check: UnderstandingCheck,
  program: Program,
  _level: Level,
  finalState?: ExecutionState
): CheckResult {
  const allBlocks = collectAllBlocks(program.main, program.functions);
  let passed = false;
  let message = check.description;

  switch (check.type) {
    case 'usesBlockType': {
      const blockType = check.blockType;
      if (!blockType) {
        passed = false;
        message = '检查配置错误：缺少 blockType';
      } else {
        passed = allBlocks.some((b) => b.type === blockType);
        message = passed
          ? `✓ 使用了 ${blockType} 指令`
          : `✗ 需要使用 ${blockType} 指令`;
      }
      break;
    }
    case 'noSpecificBlock': {
      const blockType = check.blockType;
      if (!blockType) {
        passed = false;
        message = '检查配置错误：缺少 blockType';
      } else {
        passed = !allBlocks.some((b) => b.type === blockType);
        message = passed
          ? `✓ 正确避免使用了 ${blockType} 指令`
          : `✗ 不应该使用 ${blockType} 指令`;
      }
      break;
    }
    case 'minBlockCount': {
      const min = check.count || 1;
      passed = allBlocks.length >= min;
      message = passed
        ? `✓ 使用了 ${allBlocks.length} 个指令（≥ ${min}）`
        : `✗ 指令数量不足，当前 ${allBlocks.length} 个，需要至少 ${min} 个`;
      break;
    }
    case 'maxBlockCount': {
      const max = check.count || 10;
      passed = allBlocks.length <= max;
      message = passed
        ? `✓ 使用了 ${allBlocks.length} 个指令（≤ ${max}）`
        : `✗ 指令数量过多，当前 ${allBlocks.length} 个，最多 ${max} 个`;
      break;
    }
    case 'usesLoop': {
      passed = allBlocks.some((b) => b.type === 'loop');
      message = passed ? '✓ 使用了循环指令' : '✗ 需要使用循环指令';
      break;
    }
    case 'usesCondition': {
      passed = allBlocks.some(
        (b) => b.type === 'ifWall' || b.type === 'ifStar' || b.type === 'ifEmpty'
      );
      message = passed ? '✓ 使用了条件判断指令' : '✗ 需要使用条件判断指令';
      break;
    }
    case 'usesFunction': {
      passed = allBlocks.some((b) => b.type === 'function' || b.type === 'callFunction');
      message = passed ? '✓ 使用了函数' : '✗ 需要使用函数（定义或调用）';
      break;
    }
    case 'reachesGoal': {
      if (!finalState) {
        passed = false;
        message = '需要先运行程序';
      } else {
        passed = finalState.status === 'success';
        message = passed
          ? '✓ 机器人成功到达终点'
          : `✗ 机器人未能到达终点：${finalState.error || '未知原因'}`;
      }
      break;
    }
    case 'collectsAllStars': {
      if (!finalState) {
        passed = false;
        message = '需要先运行程序';
      } else {
        passed =
          finalState.status === 'success' && finalState.robot.stars.length === 0;
        message = passed
          ? '✓ 收集了所有星星'
          : `✗ 还有星星未收集，剩余 ${finalState.robot.stars.length} 颗`;
      }
      break;
    }
    default:
      passed = false;
      message = `未知的检查类型：${check.type}`;
  }

  return {
    checkId: check.id,
    passed,
    description: check.description,
    message,
  };
}

export function validateStep(
  step: TutorialStep,
  program: Program,
  level: Level,
  runProgram: boolean = true
): StepValidationResult {
  let finalState: ExecutionState | undefined;

  if (runProgram && program.main.length > 0) {
    try {
      const steps = generateExecutionPlan(level, program);
      if (steps.length > 0) {
        finalState = steps[steps.length - 1].state;
      }
    } catch {
      finalState = createInitialExecutionState(level);
      finalState.status = 'failed';
      finalState.error = '程序执行出错';
    }
  }

  const results: CheckResult[] = step.checks.map((check) =>
    runCheck(check, program, level, finalState)
  );

  const requiredResults = results.filter(
    (r) => step.checks.find((c) => c.id === r.checkId)?.required
  );

  const allPassed =
    requiredResults.length > 0 && requiredResults.every((r) => r.passed);
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  return {
    allPassed,
    results,
    passedCount,
    totalCount,
    executionState: finalState,
  };
}

export function hasBlockType(program: Program, blockType: string): boolean {
  const allBlocks = collectAllBlocks(program.main, program.functions);
  return allBlocks.some((b) => b.type === blockType);
}

export function getBlockCount(program: Program): number {
  return collectAllBlocks(program.main, program.functions).length;
}

export function validateTutorial(tutorial: TutorialLevel): string[] {
  const errors: string[] = [];

  if (!tutorial.id) errors.push('教学关卡缺少 ID');
  if (!tutorial.name || tutorial.name.trim() === '') {
    errors.push('教学关卡名称不能为空');
  }
  if (!tutorial.steps || tutorial.steps.length === 0) {
    errors.push('至少需要添加一个教学步骤');
  }

  tutorial.steps.forEach((step, idx) => {
    if (!step.title || step.title.trim() === '') {
      errors.push(`步骤 ${idx + 1}：标题不能为空`);
    }
    if (!step.learningObjective || step.learningObjective.trim() === '') {
      errors.push(`步骤 ${idx + 1}：学习目标不能为空`);
    }
    if (!step.practiceTask || step.practiceTask.trim() === '') {
      errors.push(`步骤 ${idx + 1}：练习任务不能为空`);
    }
    if (!step.checks || step.checks.length === 0) {
      errors.push(`步骤 ${idx + 1}：至少添加一个理解检测项`);
    }
    step.checks.forEach((check, cIdx) => {
      if (!check.description || check.description.trim() === '') {
        errors.push(`步骤 ${idx + 1}，检测项 ${cIdx + 1}：描述不能为空`);
      }
    });
  });

  return errors;
}
