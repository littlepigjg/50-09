import React, { useState, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  TutorialLevel,
  TutorialStep,
  UnderstandingCheck,
  UnderstandingCheckType,
  BlockType,
  Direction,
  Position,
  Level,
} from '../engine/types';
import { validateTutorial } from '../engine/tutorialEngine';
import {
  saveTutorial,
  downloadTutorial,
  shareTutorial,
  importTutorialFromJson,
} from '../engine/storage';
import { BLOCK_CONFIGS } from '../engine/blocks';
import {
  clampPosition,
  handleEditorToolClick,
  resizeEditorGrid,
} from '../engine/gridEditor';
import type { EditorTool } from '../engine/types';
import { EditorGrid } from './editor/EditorGrid';
import { EditorToolbar } from './editor/EditorToolbar';

interface TutorialEditorProps {
  onBack: () => void;
  onTestTutorial: (tutorial: TutorialLevel) => void;
  editTutorial?: TutorialLevel;
}

const DIRECTIONS: { dir: Direction; label: string; icon: string }[] = [
  { dir: 0, label: '上', icon: '⬆️' },
  { dir: 1, label: '右', icon: '➡️' },
  { dir: 2, label: '下', icon: '⬇️' },
  { dir: 3, label: '左', icon: '⬅️' },
];

const ALL_BLOCK_TYPES: BlockType[] = [
  'move',
  'turnLeft',
  'turnRight',
  'loop',
  'ifWall',
  'ifStar',
  'ifEmpty',
  'function',
  'callFunction',
];

const CHECK_TYPES: { type: UnderstandingCheckType; label: string; desc: string }[] = [
  { type: 'usesBlockType', label: '使用某指令', desc: '检查学生是否使用了指定的指令块' },
  { type: 'noSpecificBlock', label: '禁止某指令', desc: '检查学生是否避免使用了指定指令' },
  { type: 'usesLoop', label: '使用循环', desc: '检查学生是否使用了循环指令' },
  { type: 'usesCondition', label: '使用条件', desc: '检查学生是否使用了条件判断指令' },
  { type: 'usesFunction', label: '使用函数', desc: '检查学生是否使用了函数（定义或调用）' },
  { type: 'minBlockCount', label: '最少指令数', desc: '限制最少使用的指令块数量' },
  { type: 'maxBlockCount', label: '最多指令数', desc: '限制最多使用的指令块数量' },
  { type: 'reachesGoal', label: '到达终点', desc: '检查机器人是否成功到达终点' },
  { type: 'collectsAllStars', label: '收集所有星星', desc: '检查是否收集了地图上所有星星' },
];

function genId(): string {
  return uuidv4().slice(0, 8);
}

function createEmptyStep(): TutorialStep {
  return {
    id: genId(),
    title: '',
    learningObjective: '',
    explanation: '',
    keyConcepts: [],
    practiceTask: '',
    checks: [],
    feedbackCorrect: '',
    feedbackWrong: '',
  };
}

function createEmptyCheck(): UnderstandingCheck {
  return {
    id: genId(),
    type: 'reachesGoal',
    description: '',
    required: true,
  };
}

export const TutorialEditor: React.FC<TutorialEditorProps> = ({
  onBack,
  onTestTutorial,
  editTutorial,
}) => {
  const [name, setName] = useState(editTutorial?.name || '我的教学课程');
  const [description, setDescription] = useState(editTutorial?.description || '');
  const [difficulty, setDifficulty] = useState(editTutorial?.difficulty || 1);
  const [category, setCategory] = useState(editTutorial?.category || '入门');
  const [estimatedMinutes, setEstimatedMinutes] = useState(editTutorial?.estimatedMinutes || 10);
  const [author, setAuthor] = useState(editTutorial?.author || '');
  const [steps, setSteps] = useState<TutorialStep[]>(
    editTutorial?.steps?.length ? editTutorial.steps : [createEmptyStep()]
  );
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'map' | 'steps'>('basic');
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'info' | 'warning' | 'error' }[]>([]);

  const [width, setWidth] = useState(editTutorial?.level?.width || 6);
  const [height, setHeight] = useState(editTutorial?.level?.height || 6);
  const [grid, setGrid] = useState(
    editTutorial?.level?.grid ||
      resizeEditorGrid([], 0, 0, editTutorial?.level?.width || 6, editTutorial?.level?.height || 6)
  );
  const [start, setStart] = useState<Position>(editTutorial?.level?.start || { x: 0, y: 0 });
  const [startDirection, setStartDirection] = useState<Direction>(
    editTutorial?.level?.startDirection || 1
  );
  const [goal, setGoal] = useState<Position>(editTutorial?.level?.goal || { x: 5, y: 5 });
  const [stars, setStars] = useState<Position[]>(editTutorial?.level?.stars || []);
  const [allowedBlocks, setAllowedBlocks] = useState<BlockType[]>(
    editTutorial?.level?.allowedBlocks || ALL_BLOCK_TYPES
  );
  const [maxBlocks, setMaxBlocks] = useState<number | undefined>(editTutorial?.level?.maxBlocks);
  const [hint, setHint] = useState(editTutorial?.level?.hint || '');
  const [tool, setTool] = useState<EditorTool>('wall');

  const showToast = useCallback(
    (message: string, type: 'info' | 'warning' | 'error' = 'info') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2600);
    },
    []
  );

  const tutorial: TutorialLevel = useMemo(() => {
    const levelData: Level = {
      id: `tutorial-level-${genId()}`,
      name: `${name} - 练习地图`,
      description: hint || description,
      difficulty,
      width,
      height,
      grid,
      start,
      startDirection,
      goal,
      stars,
      allowedBlocks,
      hint: hint || undefined,
      maxBlocks: maxBlocks || undefined,
    };

    return {
      id: editTutorial?.id || `tutorial-${genId()}`,
      name,
      description,
      difficulty,
      category,
      estimatedMinutes,
      prerequisites: [],
      steps,
      level: levelData,
      author: author || undefined,
      createdAt: editTutorial?.createdAt || Date.now(),
    };
  }, [
    editTutorial,
    name,
    description,
    difficulty,
    category,
    estimatedMinutes,
    steps,
    width,
    height,
    grid,
    start,
    startDirection,
    goal,
    stars,
    allowedBlocks,
    maxBlocks,
    hint,
    author,
  ]);

  const handleResize = useCallback(
    (newWidth: number, newHeight: number) => {
      const resizedGrid = resizeEditorGrid(grid, width, height, newWidth, newHeight);
      setGrid(resizedGrid);
      setWidth(newWidth);
      setHeight(newHeight);
      setStart(clampPosition(start, newWidth, newHeight));
      setGoal(clampPosition(goal, newWidth, newHeight));
      setStars(stars.filter((s) => s.x < newWidth && s.y < newHeight));
    },
    [grid, width, height, start, goal, stars]
  );

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      const result = handleEditorToolClick({
        tool,
        pos: { x, y },
        grid,
        start,
        goal,
        stars,
        width,
        height,
      });

      if (result.message) {
        showToast(result.message, result.messageType || 'info');
      }

      if (!result.consumed) return;
      if (result.grid) setGrid(result.grid);
      if (result.start) setStart(result.start);
      if (result.goal) setGoal(result.goal);
      if (result.stars) setStars(result.stars);

      if (errors.length > 0) setErrors([]);
    },
    [tool, grid, start, goal, stars, width, height, errors.length, showToast]
  );

  const updateStep = (index: number, patch: Partial<TutorialStep>) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const addStep = () => {
    const newStep = createEmptyStep();
    setSteps((prev) => [...prev, newStep]);
    setActiveStepIndex(steps.length);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) {
      showToast('至少需要保留一个步骤', 'warning');
      return;
    }
    setSteps((prev) => prev.filter((_, i) => i !== index));
    setActiveStepIndex(Math.max(0, index - 1));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= steps.length) return;
    setSteps((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
    setActiveStepIndex(newIndex);
  };

  const addCheck = (stepIndex: number) => {
    setSteps((prev) => {
      const next = [...prev];
      next[stepIndex] = {
        ...next[stepIndex],
        checks: [...next[stepIndex].checks, createEmptyCheck()],
      };
      return next;
    });
  };

  const updateCheck = (stepIndex: number, checkIndex: number, patch: Partial<UnderstandingCheck>) => {
    setSteps((prev) => {
      const next = [...prev];
      const checks = [...next[stepIndex].checks];
      checks[checkIndex] = { ...checks[checkIndex], ...patch };
      next[stepIndex] = { ...next[stepIndex], checks };
      return next;
    });
  };

  const removeCheck = (stepIndex: number, checkIndex: number) => {
    setSteps((prev) => {
      const next = [...prev];
      next[stepIndex] = {
        ...next[stepIndex],
        checks: next[stepIndex].checks.filter((_, i) => i !== checkIndex),
      };
      return next;
    });
  };

  const addKeyConcept = (stepIndex: number) => {
    setSteps((prev) => {
      const next = [...prev];
      next[stepIndex] = {
        ...next[stepIndex],
        keyConcepts: [...next[stepIndex].keyConcepts, ''],
      };
      return next;
    });
  };

  const updateKeyConcept = (stepIndex: number, conceptIndex: number, value: string) => {
    setSteps((prev) => {
      const next = [...prev];
      const concepts = [...next[stepIndex].keyConcepts];
      concepts[conceptIndex] = value;
      next[stepIndex] = { ...next[stepIndex], keyConcepts: concepts };
      return next;
    });
  };

  const removeKeyConcept = (stepIndex: number, conceptIndex: number) => {
    setSteps((prev) => {
      const next = [...prev];
      next[stepIndex] = {
        ...next[stepIndex],
        keyConcepts: next[stepIndex].keyConcepts.filter((_, i) => i !== conceptIndex),
      };
      return next;
    });
  };

  const runValidation = (): boolean => {
    const validationErrors = validateTutorial(tutorial);
    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSave = () => {
    if (!runValidation()) return;
    saveTutorial(tutorial);
    alert('教学课程已保存！');
    onBack();
  };

  const handleExport = () => {
    if (!runValidation()) return;
    downloadTutorial(tutorial);
  };

  const handleShare = async () => {
    if (!runValidation()) return;
    const success = await shareTutorial(tutorial);
    if (success) {
      alert('教学课程 JSON 已复制到剪贴板！');
    } else {
      downloadTutorial(tutorial);
    }
  };

  const handleTest = () => {
    if (!runValidation()) return;
    onTestTutorial(tutorial);
  };

  const handleImport = () => {
    const imported = importTutorialFromJson(importText);
    if (imported) {
      setName(imported.name);
      setDescription(imported.description);
      setDifficulty(imported.difficulty);
      setCategory(imported.category);
      setEstimatedMinutes(imported.estimatedMinutes);
      setSteps(imported.steps);
      setAuthor(imported.author || '');
      setWidth(imported.level.width);
      setHeight(imported.level.height);
      setGrid(imported.level.grid);
      setStart(imported.level.start);
      setStartDirection(imported.level.startDirection);
      setGoal(imported.level.goal);
      setStars(imported.level.stars);
      setAllowedBlocks(imported.level.allowedBlocks);
      setMaxBlocks(imported.level.maxBlocks);
      setHint(imported.level.hint || '');
      setShowImport(false);
      setImportText('');
      alert('教学课程导入成功！');
    } else {
      alert('导入失败，请检查 JSON 格式是否正确。');
    }
  };

  const activeStep = steps[activeStepIndex];

  return (
    <div className="min-h-screen py-6 px-4 relative">
      <div className="fixed top-4 right-4 z-50 space-y-2 w-80 pointer-events-none">
        {toasts.map((t) => {
          const styleBase =
            'px-4 py-3 rounded-xl shadow-lg border flex items-start gap-2 animate-slide-in';
          const typeStyle =
            t.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : t.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-sky-50 border-sky-200 text-sky-800';
          const icon = t.type === 'warning' ? '⚠️' : t.type === 'error' ? '❌' : 'ℹ️';
          return (
            <div key={t.id} className={`${styleBase} ${typeStyle}`}>
              <span className="text-base leading-5">{icon}</span>
              <span className="text-sm font-medium flex-1 leading-5">{t.message}</span>
            </div>
          );
        })}
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="game-card p-6 mb-4">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="btn-secondary">
                ← 返回
              </button>
              <h1 className="text-2xl font-bold text-gray-800">🎓 教学课程编辑器</h1>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => setShowImport(true)} className="btn-secondary">
                📥 导入
              </button>
              <button onClick={handleTest} className="btn-primary">
                ▶️ 试学
              </button>
              <button onClick={handleExport} className="btn-secondary">
                💾 导出
              </button>
              <button onClick={handleShare} className="btn-secondary">
                📤 分享
              </button>
              <button onClick={handleSave} className="btn-success">
                ✅ 保存
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {[
              { key: 'basic', label: '📋 基本信息', icon: '📋' },
              { key: 'map', label: '🗺️ 练习地图', icon: '🗺️' },
              { key: 'steps', label: '📚 教学步骤', icon: '📚' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <h3 className="font-bold text-red-700 mb-2">⚠️ 请修正以下问题：</h3>
              <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    📚 课程名称 *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="例如：新手入门：基础指令"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    📝 课程描述 *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                    rows={3}
                    placeholder="简要描述这门课程教什么，适合什么水平的学生"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    👤 作者（可选）
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="你的名字或团队名称"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">
                      难度：{difficulty}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={8}
                      value={difficulty}
                      onChange={(e) => setDifficulty(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>入门</span>
                      <span>困难</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">
                      ⏱️ 预计时长（分钟）
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 10)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    📂 分类
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  >
                    <option value="入门">入门</option>
                    <option value="流程控制">流程控制</option>
                    <option value="条件判断">条件判断</option>
                    <option value="函数">函数</option>
                    <option value="综合">综合</option>
                    <option value="进阶">进阶</option>
                    <option value="挑战">挑战</option>
                  </select>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-blue-700 mb-2">📖 使用说明</h4>
                  <ul className="text-sm text-blue-800 space-y-1.5">
                    <li>1️⃣ 在"基本信息"填写课程的元数据</li>
                    <li>2️⃣ 在"练习地图"设计学生练习的地图</li>
                    <li>3️⃣ 在"教学步骤"创建分步引导和理解检测</li>
                    <li>4️⃣ 点击"试学"按钮预览教学效果</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-700 mb-3">📐 地图设置</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">宽度</label>
                      <input
                        type="number"
                        min={3}
                        max={20}
                        value={width}
                        onChange={(e) =>
                          handleResize(
                            Math.max(3, Math.min(20, parseInt(e.target.value) || 3)),
                            height
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">高度</label>
                      <input
                        type="number"
                        min={3}
                        max={20}
                        value={height}
                        onChange={(e) =>
                          handleResize(
                            width,
                            Math.max(3, Math.min(20, parseInt(e.target.value) || 3))
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">起始方向</label>
                    <div className="grid grid-cols-4 gap-1">
                      {DIRECTIONS.map(({ dir, icon }) => (
                        <button
                          key={dir}
                          onClick={() => setStartDirection(dir)}
                          className={`p-2 rounded-lg text-lg transition-all ${
                            startDirection === dir
                              ? 'bg-primary-500 text-white shadow-md'
                              : 'bg-white border border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-700 mb-3">🧩 允许的指令块</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {ALL_BLOCK_TYPES.map((type) => {
                      const config = BLOCK_CONFIGS[type];
                      const checked = allowedBlocks.includes(type);
                      return (
                        <label
                          key={type}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                            checked
                              ? `${config.color} text-white shadow-sm`
                              : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAllowedBlocks([...allowedBlocks, type]);
                              } else {
                                setAllowedBlocks(allowedBlocks.filter((b) => b !== type));
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span>{config.icon}</span>
                          <span className="text-sm font-medium">{config.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setAllowedBlocks(ALL_BLOCK_TYPES)}
                      className="flex-1 text-xs py-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                    >
                      全选
                    </button>
                    <button
                      onClick={() => setAllowedBlocks([])}
                      className="flex-1 text-xs py-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      清空
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-700 mb-3">⚙️ 其他设置</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">
                        最大指令块数（0=不限制）
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={maxBlocks || 0}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0;
                          setMaxBlocks(v > 0 ? v : undefined);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">地图提示</label>
                      <textarea
                        value={hint}
                        onChange={(e) => setHint(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                        rows={2}
                        placeholder="可选：给学生的提示"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-700 mb-3">🗺️ 地图编辑</h3>
                  <EditorToolbar currentTool={tool} onToolChange={setTool} />
                  <div className="my-4">
                    <EditorGrid
                      width={width}
                      height={height}
                      grid={grid}
                      start={start}
                      goal={goal}
                      stars={stars}
                      startDirection={startDirection}
                      tool={tool}
                      onCellClick={handleCellClick}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm text-gray-600 bg-white rounded-lg py-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-blue-100 border border-dashed border-blue-400" />
                      起点 ({start.x}, {start.y})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-emerald-400" />
                      终点 ({goal.x}, {goal.y})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-yellow-400">★</span>
                      星星 {stars.length}颗
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="bg-gray-50 rounded-xl p-4 h-full flex flex-col">
                  <h3 className="font-bold text-gray-700 mb-3">📖 使用说明</h3>
                  <div className="space-y-2 text-sm text-gray-600 flex-1">
                    <p>
                      <strong>1. 选择工具：</strong>点击上方工具栏
                    </p>
                    <p>
                      <strong>2. 点击格子：</strong>放置或移除元素
                    </p>
                    <p>
                      <strong>3. 墙壁/陷阱/星星：</strong>
                      <span className="text-green-600 font-medium">再次点击同一格即可删除</span>
                    </p>
                    <p>
                      <strong>4. 擦除工具：</strong>一键清除任意元素
                    </p>
                    <p>
                      <strong>5. 设置方向：</strong>在左侧选择起始朝向
                    </p>
                  </div>
                  <div className="mt-6 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 border border-blue-100">
                    <strong>💡 建议：</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>地图不宜过大，5-7格最合适</li>
                      <li>设计能配合教学步骤的路径</li>
                      <li>确保地图有明确的解法</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-700">📚 步骤列表</h3>
                    <button
                      onClick={addStep}
                      className="text-xs px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      + 添加步骤
                    </button>
                  </div>
                  <div className="space-y-2">
                    {steps.map((step, idx) => (
                      <div
                        key={step.id}
                        className={`group p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          activeStepIndex === idx
                            ? 'bg-primary-50 border-primary-300 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setActiveStepIndex(idx)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                activeStepIndex === idx
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="text-sm font-medium text-gray-800 truncate max-w-[120px]">
                              {step.title || '未命名步骤'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveStep(idx, -1);
                              }}
                              disabled={idx === 0}
                              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-30"
                              title="上移"
                            >
                              ↑
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveStep(idx, 1);
                              }}
                              disabled={idx === steps.length - 1}
                              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-30"
                              title="下移"
                            >
                              ↓
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeStep(idx);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 text-red-500"
                              title="删除"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-9 space-y-4">
                {activeStep && (
                  <>
                    <div className="bg-gray-50 rounded-xl p-5">
                      <h3 className="font-bold text-gray-700 mb-4">
                        步骤 {activeStepIndex + 1}：{activeStep.title || '未命名'}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1.5">
                            📝 步骤标题 *
                          </label>
                          <input
                            type="text"
                            value={activeStep.title}
                            onChange={(e) => updateStep(activeStepIndex, { title: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="例如：认识前进指令"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1.5">
                            🎯 学习目标 *
                          </label>
                          <input
                            type="text"
                            value={activeStep.learningObjective}
                            onChange={(e) =>
                              updateStep(activeStepIndex, { learningObjective: e.target.value })
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="例如：理解并能正确使用前进指令"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                          📖 知识讲解 *
                        </label>
                        <textarea
                          value={activeStep.explanation}
                          onChange={(e) =>
                            updateStep(activeStepIndex, { explanation: e.target.value })
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                          rows={4}
                          placeholder="详细讲解这个知识点..."
                        />
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            💡 核心概念
                          </label>
                          <button
                            onClick={() => addKeyConcept(activeStepIndex)}
                            className="text-xs px-3 py-1 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
                          >
                            + 添加概念
                          </button>
                        </div>
                        <div className="space-y-2">
                          {activeStep.keyConcepts.map((concept, cIdx) => (
                            <div key={cIdx} className="flex items-center gap-2">
                              <span className="text-amber-500">•</span>
                              <input
                                type="text"
                                value={concept}
                                onChange={(e) =>
                                  updateKeyConcept(activeStepIndex, cIdx, e.target.value)
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                placeholder="输入一个核心概念要点"
                              />
                              <button
                                onClick={() => removeKeyConcept(activeStepIndex, cIdx)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-red-500"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                          🏋️ 练习任务 *
                        </label>
                        <textarea
                          value={activeStep.practiceTask}
                          onChange={(e) =>
                            updateStep(activeStepIndex, { practiceTask: e.target.value })
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                          rows={2}
                          placeholder="告诉学生这一步要做什么练习..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1.5">
                            🎉 完成反馈（可选）
                          </label>
                          <textarea
                            value={activeStep.feedbackCorrect || ''}
                            onChange={(e) =>
                              updateStep(activeStepIndex, { feedbackCorrect: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm"
                            rows={2}
                            placeholder="学生答对时的鼓励话语"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1.5">
                            💡 失败提示（可选）
                          </label>
                          <textarea
                            value={activeStep.feedbackWrong || ''}
                            onChange={(e) =>
                              updateStep(activeStepIndex, { feedbackWrong: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm"
                            rows={2}
                            placeholder="学生答错时的提示建议"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-700">🔍 理解检测</h3>
                        <button
                          onClick={() => addCheck(activeStepIndex)}
                          className="text-xs px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                        >
                          + 添加检测
                        </button>
                      </div>

                      {activeStep.checks.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <div className="text-4xl mb-2">🧪</div>
                          <p className="text-sm">还没有添加理解检测项</p>
                          <p className="text-xs mt-1">添加检测来验证学生是否真正理解了概念</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activeStep.checks.map((check, cIdx) => (
                            <div
                              key={check.id}
                              className="p-4 bg-white rounded-xl border border-gray-200"
                            >
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">
                                      检测类型
                                    </label>
                                    <select
                                      value={check.type}
                                      onChange={(e) =>
                                        updateCheck(activeStepIndex, cIdx, {
                                          type: e.target.value as UnderstandingCheckType,
                                        })
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white"
                                    >
                                      {CHECK_TYPES.map((ct) => (
                                        <option key={ct.type} value={ct.type}>
                                          {ct.label}
                                        </option>
                                      ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {CHECK_TYPES.find((ct) => ct.type === check.type)?.desc}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">
                                      检测描述 *
                                    </label>
                                    <input
                                      type="text"
                                      value={check.description}
                                      onChange={(e) =>
                                        updateCheck(activeStepIndex, cIdx, {
                                          description: e.target.value,
                                        })
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                      placeholder="例如：使用了前进指令"
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={check.required}
                                      onChange={(e) =>
                                        updateCheck(activeStepIndex, cIdx, {
                                          required: e.target.checked,
                                        })
                                      }
                                      className="w-4 h-4"
                                    />
                                    <span className="text-gray-700">必须通过</span>
                                  </label>
                                  <button
                                    onClick={() => removeCheck(activeStepIndex, cIdx)}
                                    className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-sm"
                                  >
                                    删除
                                  </button>
                                </div>
                              </div>

                              {(check.type === 'usesBlockType' ||
                                check.type === 'noSpecificBlock') && (
                                <div className="pt-3 border-t border-gray-100">
                                  <label className="text-xs font-medium text-gray-600 block mb-2">
                                    选择目标指令块：
                                  </label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {ALL_BLOCK_TYPES.map((bt) => {
                                      const cfg = BLOCK_CONFIGS[bt];
                                      return (
                                        <button
                                          key={bt}
                                          onClick={() =>
                                            updateCheck(activeStepIndex, cIdx, { blockType: bt })
                                          }
                                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            check.blockType === bt
                                              ? `${cfg.color} text-white shadow`
                                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                          }`}
                                        >
                                          {cfg.icon} {cfg.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {(check.type === 'minBlockCount' ||
                                check.type === 'maxBlockCount') && (
                                <div className="pt-3 border-t border-gray-100">
                                  <label className="text-xs font-medium text-gray-600 block mb-1">
                                    数量阈值：
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={check.count || 1}
                                    onChange={(e) =>
                                      updateCheck(activeStepIndex, cIdx, {
                                        count: parseInt(e.target.value) || 1,
                                      })
                                    }
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="game-card p-6 max-w-lg w-full animate-pop">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📥 导入教学课程</h2>
            <p className="text-sm text-gray-500 mb-3">
              粘贴教学课程 JSON 数据，或从 .json 文件读取：
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              placeholder='{"id":"tutorial-1","name":"...","steps":[...]}'
            />
            <div className="flex items-center gap-2 mt-3">
              <label className="flex-1">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const content = await file.text();
                      setImportText(content);
                    }
                  }}
                  className="hidden"
                />
                <div className="btn-secondary text-center cursor-pointer w-full">
                  📁 选择文件
                </div>
              </label>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowImport(false)} className="btn-secondary">
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="btn-primary"
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorialEditor;
