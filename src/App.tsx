import React, { useState, useEffect } from 'react';
import type { Level, GameMode, TutorialLevel } from './engine/types';
import { LEVELS } from './engine/levels';
import {
  loadCustomLevels,
  deleteCustomLevel,
  importLevelFromJson,
  saveCustomLevel,
  importTutorialFromJson,
  saveTutorial,
} from './engine/storage';
import { LevelSelect } from './components/LevelSelect';
import { GameScreen } from './components/GameScreen';
import { LevelEditor } from './components/LevelEditor';
import { TutorialSelect } from './components/TutorialSelect';
import { TutorialGameScreen } from './components/TutorialGameScreen';
import { TutorialEditor } from './components/TutorialEditor';
import { v4 as uuidv4 } from 'uuid';

const ImportLevelModal: React.FC<{
  onClose: () => void;
  onImport: (level: Level) => void;
}> = ({ onClose, onImport }) => {
  const [text, setText] = useState('');

  const handleImport = () => {
    const level = importLevelFromJson(text);
    if (level) {
      level.id = `custom-${uuidv4().slice(0, 8)}`;
      saveCustomLevel(level);
      onImport(level);
      onClose();
    } else {
      alert('导入失败：JSON 格式不正确');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="game-card p-6 max-w-lg w-full animate-pop">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📥 导入关卡</h2>
        <p className="text-sm text-gray-500 mb-3">
          粘贴关卡 JSON 数据，或从 .json 文件读取：
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-primary-500 outline-none resize-none"
          placeholder='{"id":"level-1","name":"第1关",...}'
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
                  setText(content);
                }
              }}
              className="hidden"
            />
            <div className="btn-secondary text-center cursor-pointer">📁 选择文件</div>
          </label>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button onClick={handleImport} disabled={!text.trim()} className="btn-primary">
            导入
          </button>
        </div>
      </div>
    </div>
  );
};

const ImportTutorialModal: React.FC<{
  onClose: () => void;
  onImport: () => void;
}> = ({ onClose, onImport }) => {
  const [text, setText] = useState('');

  const handleImport = () => {
    const tutorial = importTutorialFromJson(text);
    if (tutorial) {
      tutorial.id = `tutorial-custom-${uuidv4().slice(0, 8)}`;
      saveTutorial(tutorial);
      onImport();
      onClose();
    } else {
      alert('导入失败：JSON 格式不正确');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="game-card p-6 max-w-lg w-full animate-pop">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📥 导入教学课程</h2>
        <p className="text-sm text-gray-500 mb-3">
          粘贴教学课程 JSON 数据，或从 .json 文件读取：
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
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
                  setText(content);
                }
              }}
              className="hidden"
            />
            <div className="btn-secondary text-center cursor-pointer">📁 选择文件</div>
          </label>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button onClick={handleImport} disabled={!text.trim()} className="btn-primary">
            导入
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>('menu');
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [customLevels, setCustomLevels] = useState<Level[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [editLevel, setEditLevel] = useState<Level | undefined>(undefined);

  const [currentTutorial, setCurrentTutorial] = useState<TutorialLevel | null>(null);
  const [showTutorialImport, setShowTutorialImport] = useState(false);
  const [editTutorial, setEditTutorial] = useState<TutorialLevel | undefined>(undefined);
  const [, setRefreshKey] = useState(0);

  useEffect(() => {
    setCustomLevels(loadCustomLevels());
  }, []);

  const refreshCustomLevels = () => {
    setCustomLevels(loadCustomLevels());
  };

  const refreshTutorials = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleSelectLevel = (level: Level) => {
    setCurrentLevel(level);
    setMode('play');
  };

  const handleBack = () => {
    setCurrentLevel(null);
    setMode('menu');
    refreshCustomLevels();
  };

  const handleNextLevel = () => {
    if (!currentLevel) return;
    const index = LEVELS.findIndex((l) => l.id === currentLevel.id);
    if (index >= 0 && index < LEVELS.length - 1) {
      setCurrentLevel(LEVELS[index + 1]);
    }
  };

  const handleDeleteCustom = () => {
    if (currentLevel) {
      deleteCustomLevel(currentLevel.id);
      refreshCustomLevels();
      handleBack();
    }
  };

  const handleOpenEditor = () => {
    setEditLevel(undefined);
    setMode('editor');
  };

  const handleImportDone = () => {
    refreshCustomLevels();
    setShowImport(false);
  };

  const isCustom = currentLevel ? customLevels.some((l) => l.id === currentLevel.id) : false;

  const handleOpenTutorialMenu = () => {
    setMode('tutorial-menu');
    refreshTutorials();
  };

  const handleSelectTutorial = (tutorial: TutorialLevel) => {
    setCurrentTutorial(tutorial);
    setMode('tutorial-play');
  };

  const handleBackFromTutorial = () => {
    setCurrentTutorial(null);
    setMode('tutorial-menu');
    refreshTutorials();
  };

  const handleBackFromTutorialMenu = () => {
    setMode('menu');
  };

  const handleOpenTutorialEditor = () => {
    setEditTutorial(undefined);
    setMode('tutorial-editor');
  };

  const handleBackFromTutorialEditor = () => {
    setMode('tutorial-menu');
    refreshTutorials();
  };

  const handleTestTutorial = (tutorial: TutorialLevel) => {
    setCurrentTutorial(tutorial);
    setMode('tutorial-play');
  };

  const handleImportTutorialDone = () => {
    refreshTutorials();
    setShowTutorialImport(false);
  };

  return (
    <div className="min-h-screen">
      {mode === 'menu' && (
        <div>
          <LevelSelect
            onSelectLevel={handleSelectLevel}
            onOpenEditor={handleOpenEditor}
            onImportLevel={() => setShowImport(true)}
            customLevels={customLevels}
          />
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <button
              onClick={handleOpenTutorialMenu}
              className="btn-primary !px-8 !py-4 !text-lg shadow-2xl flex items-center gap-3"
            >
              <span className="text-2xl">🎓</span>
              <span>进入教学中心</span>
            </button>
          </div>
        </div>
      )}

      {mode === 'play' && currentLevel && (
        <GameScreen
          level={currentLevel}
          onBack={handleBack}
          onNextLevel={
            LEVELS.findIndex((l) => l.id === currentLevel.id) < LEVELS.length - 1
              ? handleNextLevel
              : undefined
          }
          isCustom={isCustom}
          onDeleteCustom={isCustom ? handleDeleteCustom : undefined}
        />
      )}

      {mode === 'editor' && (
        <LevelEditor
          onBack={() => {
            setMode('menu');
            refreshCustomLevels();
          }}
          onPlayLevel={(level) => {
            setCurrentLevel(level);
            setMode('play');
          }}
          editLevel={editLevel}
        />
      )}

      {mode === 'tutorial-menu' && (
        <TutorialSelect
          onSelectTutorial={handleSelectTutorial}
          onBack={handleBackFromTutorialMenu}
          onOpenEditor={handleOpenTutorialEditor}
          onImport={() => setShowTutorialImport(true)}
        />
      )}

      {mode === 'tutorial-play' && currentTutorial && (
        <TutorialGameScreen
          tutorial={currentTutorial}
          onBack={handleBackFromTutorial}
        />
      )}

      {mode === 'tutorial-editor' && (
        <TutorialEditor
          onBack={handleBackFromTutorialEditor}
          onTestTutorial={handleTestTutorial}
          editTutorial={editTutorial}
        />
      )}

      {showImport && (
        <ImportLevelModal onClose={() => setShowImport(false)} onImport={handleImportDone} />
      )}

      {showTutorialImport && (
        <ImportTutorialModal
          onClose={() => setShowTutorialImport(false)}
          onImport={handleImportTutorialDone}
        />
      )}
    </div>
  );
};

export default App;
