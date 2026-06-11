import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Program, ProgramBlock, TutorialLevel, TutorialProgress, TutorialStepProgress } from '../engine/types';
import type { ExecutionStep } from '../engine/GameEngine';
import {
  createInitialExecutionState,
  generateExecutionPlan,
} from '../engine/GameEngine';
import { validateStep } from '../engine/tutorialEngine';
import type { StepValidationResult } from '../engine/tutorialEngine';
import { updateTutorialProgress, getTutorialProgress } from '../engine/storage';
import { BlockPalette } from './blocks/BlockPalette';
import { ProgramArea } from './blocks/ProgramArea';
import { GameGrid } from './game/GameGrid';

interface TutorialGameScreenProps {
  tutorial: TutorialLevel;
  onBack: () => void;
}

const CheckResultDisplay: React.FC<{
  validation: StepValidationResult | null;
}> = ({ validation }) => {
  if (!validation) {
    return (
      <div className="text-center text-gray-400 py-6">
        <div className="text-3xl mb-2">🧪</div>
        <p className="text-sm">点击"检查答案"来验证你的学习成果</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {validation.results.map((result) => (
        <div
          key={result.checkId}
          className={`flex items-start gap-2 p-3 rounded-lg transition-all ${
            result.passed
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <span className="text-lg flex-shrink-0">{result.passed ? '✅' : '❌'}</span>
          <div className="flex-1">
            <div
              className={`text-sm font-medium ${
                result.passed ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {result.message}
            </div>
          </div>
        </div>
      ))}
      <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
        <div className="text-sm text-gray-600">
          通过检测：
          <span className="font-bold text-primary-600 ml-1">
            {validation.passedCount} / {validation.totalCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export const TutorialGameScreen: React.FC<TutorialGameScreenProps> = ({
  tutorial,
  onBack,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mainBlocks, setMainBlocks] = useState<ProgramBlock[]>([]);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [execStepIndex, setExecStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [validation, setValidation] = useState<StepValidationResult | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const animationRef = useRef<number | null>(null);

  const currentStep = tutorial.steps[currentStepIndex];
  const level = tutorial.level;

  const currentState = executionSteps[execStepIndex]?.state || createInitialExecutionState(level);

  const program: Program = useMemo(() => {
    return {
      main: mainBlocks,
      functions: {},
    };
  }, [mainBlocks]);

  const cellSize = useMemo(() => {
    const maxWidth = Math.min(window.innerWidth * 0.35, 450);
    const maxHeight = Math.min(window.innerHeight * 0.5, 450);
    const byWidth = Math.floor(maxWidth / level.width);
    const byHeight = Math.floor(maxHeight / level.height);
    return Math.max(36, Math.min(60, Math.min(byWidth, byHeight)));
  }, [level.width, level.height]);

  const progress: TutorialProgress | undefined = useMemo(() => {
    return getTutorialProgress(tutorial.id);
  }, [tutorial.id]);

  const runProgram = () => {
    if (mainBlocks.length === 0) return;

    try {
      const steps = generateExecutionPlan(level, program);
      setExecutionSteps(steps);
      setExecStepIndex(0);
      setIsRunning(true);
      setShowResult(false);
    } catch (e) {
      alert('程序执行出错：' + (e as Error).message);
    }
  };

  useEffect(() => {
    if (!isRunning || executionSteps.length === 0) return;

    if (execStepIndex >= executionSteps.length - 1) {
      setIsRunning(false);
      setShowResult(true);
      return;
    }

    animationRef.current = window.setTimeout(() => {
      setExecStepIndex((prev) => prev + 1);
    }, speed);

    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [isRunning, execStepIndex, executionSteps, speed]);

  const handleReset = () => {
    if (animationRef.current) clearTimeout(animationRef.current);
    setIsRunning(false);
    setExecutionSteps([]);
    setExecStepIndex(0);
    setShowResult(false);
  };

  const handleStepThrough = () => {
    if (executionSteps.length === 0) {
      try {
        const steps = generateExecutionPlan(level, program);
        setExecutionSteps(steps);
        setExecStepIndex(0);
      } catch (e) {
        alert('程序执行出错：' + (e as Error).message);
      }
      return;
    }

    if (execStepIndex < executionSteps.length - 1) {
      setExecStepIndex((prev) => prev + 1);
      if (execStepIndex === executionSteps.length - 2) {
        setShowResult(true);
      }
    }
  };

  const handleCheckAnswer = () => {
    const result = validateStep(currentStep, program, level, true);
    setValidation(result);

    if (result.allPassed) {
      setShowCongrats(true);
      saveStepProgress(true, result);
    } else {
      saveStepProgress(false, result);
    }
  };

  const saveStepProgress = (passed: boolean, result: StepValidationResult) => {
    const stepProgresses: TutorialStepProgress[] = tutorial.steps.map((s, idx) => {
      if (idx === currentStepIndex) {
        return {
          stepId: s.id,
          completed: passed,
          attempts: (progress?.steps[idx]?.attempts || 0) + 1,
          passedChecks: result.results.filter((r) => r.passed).map((r) => r.checkId),
          failedChecks: result.results.filter((r) => !r.passed).map((r) => r.checkId),
        };
      }
      return (
        progress?.steps[idx] || {
          stepId: s.id,
          completed: false,
          attempts: 0,
          passedChecks: [],
          failedChecks: [],
        }
      );
    });

    const allCompleted = passed && currentStepIndex === tutorial.steps.length - 1;

    const newProgress: TutorialProgress = {
      tutorialId: tutorial.id,
      currentStepIndex: passed
        ? Math.min(currentStepIndex + 1, tutorial.steps.length - 1)
        : currentStepIndex,
      steps: stepProgresses,
      completed: allCompleted,
      startedAt: progress?.startedAt || Date.now(),
      completedAt: allCompleted ? Date.now() : progress?.completedAt,
    };

    updateTutorialProgress(tutorial.id, newProgress);
  };

  const handleNextStep = () => {
    setShowCongrats(false);
    if (currentStepIndex < tutorial.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setMainBlocks([]);
      setValidation(null);
      handleReset();
    } else {
      alert('🎉 恭喜你完成了整个教学课程！');
      onBack();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setMainBlocks([]);
      setValidation(null);
      handleReset();
      setShowCongrats(false);
    }
  };

  const finalState = executionSteps.length > 0 ? executionSteps[executionSteps.length - 1].state : null;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === tutorial.steps.length - 1;

  return (
    <div className="min-h-screen py-4 px-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="game-card p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="btn-secondary !py-2 !px-4 flex items-center gap-2"
              >
                ← 返回
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{tutorial.name}</h1>
                <p className="text-sm text-gray-500">
                  步骤 {currentStepIndex + 1} / {tutorial.steps.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
                {tutorial.steps.map((_, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  const isDone = progress?.steps[idx]?.completed;
                  return (
                    <div
                      key={idx}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-primary-500 text-white shadow-md scale-110'
                          : isDone
                          ? 'bg-green-400 text-white'
                          : 'bg-white text-gray-400'
                      }`}
                    >
                      {isDone ? '✓' : idx + 1}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-2 py-1">
                <span className="text-xs text-gray-500 px-2">速度</span>
                {[200, 500, 1000].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all
                      ${speed === s ? 'bg-primary-500 text-white' : 'hover:bg-gray-200 text-gray-600'}`}
                  >
                    {s === 200 ? '快' : s === 500 ? '中' : '慢'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3 space-y-4">
            <div className="game-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary-600 flex items-center gap-2">
                  <span>📚</span> {currentStep.title}
                </h3>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-xs font-bold text-blue-600 mb-1">🎯 学习目标</div>
                <div className="text-sm text-blue-800">{currentStep.learningObjective}</div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {currentStep.explanation}
                </div>
              </div>

              {currentStep.keyConcepts.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="text-xs font-bold text-amber-700 mb-2">💡 核心概念</div>
                  <ul className="space-y-1">
                    {currentStep.keyConcepts.map((concept, idx) => (
                      <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                        <span className="text-amber-500 flex-shrink-0">•</span>
                        <span>{concept}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentStep.exampleCode && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowExample(!showExample)}
                    className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-100 transition-all text-left"
                  >
                    <div className="text-sm font-bold text-purple-700 flex items-center justify-between">
                      <span>📝 查看示例代码</span>
                      <span>{showExample ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {showExample && (
                    <div className="mt-2 p-3 bg-purple-50 rounded-xl border border-purple-100 animate-pop">
                      <div className="text-sm text-purple-800 mb-3">
                        {currentStep.exampleCode.explanation}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {currentStep.exampleCode.blocks.map((block, idx) => (
                          <div
                            key={idx}
                            className="px-2.5 py-1 bg-primary-500 text-white text-xs rounded-md font-medium"
                          >
                            {block.type === 'move'
                              ? '➡️前进'
                              : block.type === 'turnLeft'
                              ? '↪️左转'
                              : block.type === 'turnRight'
                              ? '↩️右转'
                              : block.type === 'loop'
                              ? `🔄循环(${block.repeatCount || 2}次)`
                              : block.type}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="text-xs font-bold text-green-700 mb-1">🏋️ 练习任务</div>
                <div className="text-sm text-green-800">{currentStep.practiceTask}</div>
              </div>
            </div>

            <div className="game-card p-5">
              <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span>🔍</span> 理解检测
              </h3>
              <CheckResultDisplay validation={validation} />
              <button
                onClick={handleCheckAnswer}
                disabled={mainBlocks.length === 0}
                className="w-full mt-4 btn-primary !py-2.5 flex items-center justify-center gap-2"
              >
                ✅ 检查我的答案
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="game-card p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span>🗺️</span> 游戏地图
                </h3>
                <div className="text-sm text-gray-500">
                  {isRunning && executionSteps.length > 0 && (
                    <span>
                      步骤 {execStepIndex + 1} / {executionSteps.length}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <GameGrid
                  level={level}
                  robotState={currentState.robot}
                  collectedStars={currentState.collectedStars}
                  cellSize={cellSize}
                  isAnimating={isRunning}
                />
              </div>

              <div className="mt-4 flex gap-3 justify-center flex-wrap">
                <button
                  onClick={runProgram}
                  disabled={isRunning || mainBlocks.length === 0}
                  className="btn-success flex items-center gap-2 !py-2.5"
                >
                  ▶️ 运行
                </button>
                <button
                  onClick={handleStepThrough}
                  disabled={isRunning || mainBlocks.length === 0}
                  className="btn-primary flex items-center gap-2 !py-2.5"
                >
                  ⏭️ 单步
                </button>
                <button
                  onClick={handleReset}
                  className="btn-danger flex items-center gap-2 !py-2.5"
                >
                  🔄 重置
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  onClick={handlePrevStep}
                  disabled={isFirstStep}
                  className="btn-secondary disabled:opacity-40"
                >
                  ← 上一步
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={isLastStep && !showCongrats}
                  className="btn-success disabled:opacity-40"
                >
                  {isLastStep ? '🎉 完成课程' : '下一步 →'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="game-card p-4 h-full flex flex-col">
              <div className="mb-2">
                <BlockPalette allowedBlocks={level.allowedBlocks} disabled={isRunning} />
              </div>
              <div className="flex-1">
                <ProgramArea
                  blocks={mainBlocks}
                  onBlocksChange={setMainBlocks}
                  highlightedBlockId={currentState.highlightedBlockId}
                  disabled={isRunning}
                  maxBlocks={level.maxBlocks}
                />
              </div>
            </div>
          </div>
        </div>

        {showCongrats && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn p-4">
            <div className="game-card p-8 max-w-md w-full text-center animate-pop">
              <div className="text-7xl mb-4 animate-bounce">🎉</div>
              <h2 className="text-3xl font-bold text-green-600 mb-2">太棒了！</h2>
              <p className="text-gray-600 mb-4">
                {currentStep.feedbackCorrect || '你成功完成了这一步！'}
              </p>
              <div className="flex gap-3 justify-center mt-6">
                <button onClick={() => setShowCongrats(false)} className="btn-secondary">
                  继续练习
                </button>
                <button onClick={handleNextStep} className="btn-success">
                  {isLastStep ? '🎉 完成课程' : '下一步 →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showResult && finalState && finalState.status === 'failed' && !showCongrats && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn p-4">
            <div className="game-card p-6 max-w-md w-full text-center animate-pop">
              <div className="text-5xl mb-3">💡</div>
              <h2 className="text-xl font-bold text-gray-700 mb-2">小提示</h2>
              <p className="text-gray-600 mb-4 text-sm">
                {currentStep.feedbackWrong || '程序运行失败了，再检查一下你的代码吧！'}
              </p>
              <p className="text-xs text-red-500 mb-4">
                错误：{finalState.error}
              </p>
              <button
                onClick={() => setShowResult(false)}
                className="btn-primary"
              >
                我知道了
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorialGameScreen;
