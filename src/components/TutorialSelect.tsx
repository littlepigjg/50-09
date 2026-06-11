import React, { useMemo } from 'react';
import type { TutorialLevel } from '../engine/types';
import { PRESET_TUTORIALS } from '../engine/tutorialLevels';
import { loadTutorials, loadTutorialProgress, deleteTutorial } from '../engine/storage';

interface TutorialSelectProps {
  onSelectTutorial: (tutorial: TutorialLevel) => void;
  onBack: () => void;
  onOpenEditor: () => void;
  onImport: () => void;
}

const DifficultyBadge: React.FC<{ difficulty: number }> = ({ difficulty }) => {
  const colors = [
    'bg-green-100 text-green-700',
    'bg-green-100 text-green-700',
    'bg-blue-100 text-blue-700',
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
    'bg-red-100 text-red-700',
  ];
  const color = colors[Math.min(difficulty, colors.length - 1)];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {'★'.repeat(Math.min(difficulty, 5))}
    </span>
  );
};

const CATEGORY_COLORS: Record<string, string> = {
  入门: 'bg-green-100 text-green-700 border-green-200',
  流程控制: 'bg-blue-100 text-blue-700 border-blue-200',
  条件判断: 'bg-purple-100 text-purple-700 border-purple-200',
  函数: 'bg-pink-100 text-pink-700 border-pink-200',
  综合: 'bg-amber-100 text-amber-700 border-amber-200',
  进阶: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  挑战: 'bg-red-100 text-red-700 border-red-200',
};

export const TutorialSelect: React.FC<TutorialSelectProps> = ({
  onSelectTutorial,
  onBack,
  onOpenEditor,
  onImport,
}) => {
  const customTutorials = useMemo(() => loadTutorials(), []);
  const allProgress = useMemo(() => loadTutorialProgress(), []);
  const allTutorials = useMemo(
    () => [...PRESET_TUTORIALS, ...customTutorials],
    [customTutorials]
  );

  const [filter, setFilter] = React.useState<'all' | 'preset' | 'custom'>('all');

  const displayedTutorials = useMemo(() => {
    if (filter === 'preset') return PRESET_TUTORIALS;
    if (filter === 'custom') return customTutorials;
    return allTutorials;
  }, [filter, allTutorials, customTutorials]);

  const totalCompleted = useMemo(() => {
    return PRESET_TUTORIALS.filter((t) => allProgress[t.id]?.completed).length;
  }, [allProgress]);

  const totalStepsCompleted = useMemo(() => {
    return allTutorials.reduce((acc, t) => {
      const progress = allProgress[t.id];
      if (!progress) return acc;
      return acc + progress.steps.filter((s) => s.completed).length;
    }, 0);
  }, [allTutorials, allProgress]);

  const totalSteps = useMemo(() => {
    return allTutorials.reduce((acc, t) => acc + t.steps.length, 0);
  }, [allTutorials]);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="game-card p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={onBack} className="btn-secondary">
              ← 返回主菜单
            </button>
            <div className="flex items-center gap-3">
              <span className="text-5xl">🎓</span>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  教学中心
                </h1>
                <p className="text-gray-500 mt-1">系统化学习编程概念，循序渐进掌握技能</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {totalCompleted}/{PRESET_TUTORIALS.length}
              </div>
              <div className="text-sm text-gray-500">课程完成</div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">
                {totalStepsCompleted}/{totalSteps}
              </div>
              <div className="text-sm text-gray-500">步骤完成</div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500">{customTutorials.length}</div>
              <div className="text-sm text-gray-500">自定义课程</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center mt-8">
            <button onClick={onOpenEditor} className="btn-primary">
              ✏️ 教学编辑器
            </button>
            <button onClick={onImport} className="btn-secondary">
              📥 导入课程
            </button>
          </div>
        </div>

        <div className="game-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">选择课程</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilter('preset')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'preset'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                官方
              </button>
              <button
                onClick={() => setFilter('custom')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'custom'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                自定义
              </button>
            </div>
          </div>

          {displayedTutorials.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📭</div>
              <p>暂无{filter === 'custom' ? '自定义' : ''}课程</p>
              {filter === 'custom' && (
                <p className="text-sm mt-2">使用教学编辑器创建你的第一个课程吧！</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedTutorials.map((tutorial) => {
                const progress = allProgress[tutorial.id];
                const isCustom = customTutorials.some((t) => t.id === tutorial.id);
                const stepProgress = progress
                  ? tutorial.steps.map(
                      (s) => progress.steps.find((p) => p.stepId === s.id)?.completed || false
                    )
                  : tutorial.steps.map(() => false);
                const completedSteps = stepProgress.filter(Boolean).length;
                const percentage = Math.round((completedSteps / tutorial.steps.length) * 100);

                return (
                  <div
                    key={tutorial.id}
                    className={`relative p-5 rounded-xl border-2 transition-all duration-200 bg-white hover:shadow-lg cursor-pointer border-gray-200 hover:border-primary-400 ${
                      progress?.completed ? 'border-green-400 bg-green-50/30' : ''
                    }`}
                    onClick={() => onSelectTutorial(tutorial)}
                  >
                    {isCustom && (
                      <span className="absolute top-3 right-3 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                        自定义
                      </span>
                    )}
                    {progress?.completed && (
                      <span className="absolute top-3 right-3 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                        ✓ 已完成
                      </span>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                          {tutorial.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {tutorial.description}
                        </p>
                      </div>
                      <DifficultyBadge difficulty={tutorial.difficulty} />
                    </div>

                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border ${
                          CATEGORY_COLORS[tutorial.category] ||
                          'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {tutorial.category}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        📚 {tutorial.steps.length} 步
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        ⏱️ {tutorial.estimatedMinutes} 分钟
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span>学习进度</span>
                        <span className="font-medium">
                          {completedSteps}/{tutorial.steps.length} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            progress?.completed
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                              : 'bg-gradient-to-r from-primary-400 to-primary-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {tutorial.author && (
                      <div className="mt-3 text-xs text-gray-400">
                        作者：{tutorial.author}
                      </div>
                    )}

                    {isCustom && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('确定要删除这个自定义课程吗？')) {
                              deleteTutorial(tutorial.id);
                              window.location.reload();
                            }
                          }}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          🗑️ 删除
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-center mt-8 text-white/70 text-sm">
          💡 提示：完成所有步骤即可掌握完整的编程概念！
        </div>
      </div>
    </div>
  );
};

export default TutorialSelect;
