import type { TutorialLevel, CellType } from './types';
import { v4 as uuidv4 } from 'uuid';

function makeGrid(
  width: number,
  height: number,
  walls: [number, number][] = [],
  pits: [number, number][] = []
): CellType[][] {
  const grid: CellType[][] = [];
  for (let y = 0; y < height; y++) {
    const row: CellType[] = [];
    for (let x = 0; x < width; x++) {
      let cell: CellType = 'empty';
      if (walls.some(([wx, wy]) => wx === x && wy === y)) cell = 'wall';
      if (pits.some(([px, py]) => px === x && py === y)) cell = 'pit';
      row.push(cell);
    }
    grid.push(row);
  }
  return grid;
}

function genId(): string {
  return uuidv4().slice(0, 8);
}

export const PRESET_TUTORIALS: TutorialLevel[] = [
  {
    id: 'tutorial-basics',
    name: '新手入门：基础指令',
    description: '学习最基础的前进和转弯指令，迈出编程的第一步！',
    difficulty: 1,
    category: '入门',
    estimatedMinutes: 10,
    prerequisites: [],
    steps: [
      {
        id: 'step-move',
        title: '第一步：认识"前进"',
        learningObjective: '理解并能正确使用"前进"指令让机器人移动',
        explanation:
          '🤖 机器人在地图上移动最基本的指令就是"前进"。每使用一次"前进"指令，机器人就会朝着当前朝向移动一格。',
        keyConcepts: [
          '机器人有朝向（上、下、左、右）',
          '"前进"指令会让机器人向当前朝向移动一格',
          '如果前方是墙或出了地图，机器人会撞墙失败',
        ],
        exampleCode: {
          explanation:
            '这个例子使用了两次"前进"，机器人会向右走两步：',
          blocks: [
            { id: genId(), type: 'move' },
            { id: genId(), type: 'move' },
          ],
        },
        practiceTask:
          '👉 请在右侧程序区拖入"前进"指令，让机器人向右走到绿色终点。',
        checks: [
          {
            id: 'c1',
            type: 'usesBlockType',
            blockType: 'move',
            description: '使用了"前进"指令',
            required: true,
          },
          {
            id: 'c2',
            type: 'reachesGoal',
            description: '机器人成功到达终点',
            required: true,
          },
        ],
        feedbackCorrect:
          '🎉 太棒了！你成功让机器人到达了终点！"前进"指令是不是很简单？',
        feedbackWrong:
          '💪 再试一次！确保机器人能走到绿色终点，注意不要撞墙哦。',
      },
      {
        id: 'step-turn-right',
        title: '第二步：学会"右转"',
        learningObjective: '理解"右转"指令会改变机器人的朝向',
        explanation:
          '↩️ "右转"指令不会让机器人移动，但会让它顺时针旋转90度。比如机器人朝向右时，右转后就会朝下。',
        keyConcepts: [
          '"右转"只改变朝向，不移动位置',
          '顺时针旋转90度：上→右→下→左→上',
          '可以连续多次右转，改变朝向更大的角度',
        ],
        exampleCode: {
          explanation:
            '这个例子中：机器人先前进2步，然后右转（朝向变为向下），再前进2步：',
          blocks: [
            { id: genId(), type: 'move' },
            { id: genId(), type: 'move' },
            { id: genId(), type: 'turnRight' },
            { id: genId(), type: 'move' },
            { id: genId(), type: 'move' },
          ],
        },
        practiceTask:
          '👉 先向右走2步，然后右转（朝下），再向下走2步到达终点。记得用"右转"指令！',
        checks: [
          {
            id: 'c1',
            type: 'usesBlockType',
            blockType: 'turnRight',
            description: '使用了"右转"指令',
            required: true,
          },
          {
            id: 'c2',
            type: 'usesBlockType',
            blockType: 'move',
            description: '使用了"前进"指令',
            required: true,
          },
          {
            id: 'c3',
            type: 'reachesGoal',
            description: '机器人成功到达终点',
            required: true,
          },
        ],
        feedbackCorrect:
          '🎉 干得好！你已经学会了"右转"指令，现在可以让机器人拐弯啦！',
        feedbackWrong:
          '💪 再试一次！先向右走，再右转向下走。不要忘了使用"右转"指令。',
      },
      {
        id: 'step-turn-left',
        title: '第三步：学会"左转"',
        learningObjective: '对比理解左转和右转的区别',
        explanation:
          '↪️ "左转"和"右转"类似，但是是逆时针旋转90度。比如机器人朝向右时，左转后就会朝上。',
        keyConcepts: [
          '"左转"是逆时针旋转90度：上→左→下→右→上',
          '两次左转等于一次右转（180度转身）',
          '选择左/右转取决于哪个路径更短',
        ],
        exampleCode: {
          explanation:
            '这个例子中：机器人先前进3步，然后左转（朝向变为向上），再前进3步：',
          blocks: [
            { id: genId(), type: 'move' },
            { id: genId(), type: 'move' },
            { id: genId(), type: 'move' },
            { id: genId(), type: 'turnLeft' },
            { id: genId(), type: 'move' },
            { id: genId(), type: 'move' },
            { id: genId(), type: 'move' },
          ],
        },
        practiceTask:
          '👉 先向右走3步，然后左转（朝上），再向上走3步到达终点。',
        checks: [
          {
            id: 'c1',
            type: 'usesBlockType',
            blockType: 'turnLeft',
            description: '使用了"左转"指令',
            required: true,
          },
          {
            id: 'c2',
            type: 'reachesGoal',
            description: '机器人成功到达终点',
            required: true,
          },
        ],
        feedbackCorrect:
          '🎉 完美！你现在已经掌握了前进、左转和右转。可以组合使用它们走复杂路线了！',
        feedbackWrong:
          '💪 再试一次！仔细想想路线：先向右，再左转向上。',
      },
      {
        id: 'step-combination',
        title: '第四步：组合挑战',
        learningObjective: '灵活组合三种基础指令，规划路径',
        explanation:
          '🧩 现在你已经学会了三种基础指令。实际编程中，你需要观察地图，思考机器人需要走什么路线，然后选择合适的指令组合。',
        keyConcepts: [
          '先观察地图，规划路径',
          '把路径拆分成"前进"+"转向"的组合',
          '尝试找出最优（最短）路径',
        ],
        practiceTask:
          '👉 观察地图，组合使用前进、左转、右转，让机器人到达终点！',
        checks: [
          {
            id: 'c1',
            type: 'usesBlockType',
            blockType: 'move',
            description: '使用了"前进"指令',
            required: true,
          },
          {
            id: 'c2',
            type: 'reachesGoal',
            description: '机器人成功到达终点',
            required: true,
          },
          {
            id: 'c3',
            type: 'maxBlockCount',
            count: 10,
            description: '使用不超过10个指令（挑战优化）',
            required: false,
          },
        ],
        feedbackCorrect:
          '🏆 恭喜你完成了基础指令的全部学习！现在你可以挑战更高级的概念了。',
        feedbackWrong:
          '💪 再试一次！一步步来，先观察路径再动手。',
      },
    ],
    level: {
      id: 'tutorial-basics-level',
      name: '基础指令教学',
      description: '用于教学的地图',
      difficulty: 1,
      width: 6,
      height: 6,
      grid: makeGrid(6, 6),
      start: { x: 0, y: 2 },
      startDirection: 1,
      goal: { x: 4, y: 2 },
      stars: [],
      allowedBlocks: ['move', 'turnLeft', 'turnRight'],
    },
    author: 'CodeRobot Team',
    createdAt: Date.now(),
  },
  {
    id: 'tutorial-loop',
    name: '进阶：循环的力量',
    description: '学习使用循环指令，让代码更简洁高效！',
    difficulty: 2,
    category: '流程控制',
    estimatedMinutes: 15,
    prerequisites: ['基础指令'],
    steps: [
      {
        id: 'step-loop-intro',
        title: '为什么需要循环？',
        learningObjective: '理解循环可以减少重复代码',
        explanation:
          '🔄 如果要让机器人前进10步，你需要拖入10个"前进"指令吗？不需要！使用"循环"指令可以让一段代码重复执行多次。',
        keyConcepts: [
          '循环 = 重复执行相同的代码',
          '可以指定重复的次数（默认为2次）',
          '循环让代码更简洁、更易修改',
        ],
        exampleCode: {
          explanation:
            '这段代码让"前进"指令重复执行6次，机器人会连续走6步：',
          blocks: [
            {
              id: genId(),
              type: 'loop',
              repeatCount: 6,
              children: [{ id: genId(), type: 'move' }],
            },
          ],
        },
        practiceTask:
          '👉 使用"循环"指令让机器人前进6步到达终点。只需要用1个循环包裹1个前进！',
        checks: [
          {
            id: 'c1',
            type: 'usesLoop',
            description: '使用了循环指令',
            required: true,
          },
          {
            id: 'c2',
            type: 'maxBlockCount',
            count: 3,
            description: '只用了不超过3个指令块（挑战）',
            required: false,
          },
          {
            id: 'c3',
            type: 'reachesGoal',
            description: '机器人成功到达终点',
            required: true,
          },
        ],
        feedbackCorrect:
          '🎉 太棒了！你看到循环的威力了吗？6步路只需要2个指令块！',
        feedbackWrong:
          '💪 再试一次！把"前进"拖到循环里面，然后设置循环次数为6。',
      },
      {
        id: 'step-loop-multiple',
        title: '循环里放多个指令',
        learningObjective: '循环可以包含多个指令',
        explanation:
          '🎁 循环不止可以放一个指令！你可以把多个指令拖进循环里，它们会按顺序重复执行。',
        keyConcepts: [
          '循环内可以放多个指令',
          '每次循环会按顺序执行里面的所有指令',
          '循环+转向 = 画图形的利器',
        ],
        exampleCode: {
          explanation:
            '这个循环会重复4次：每次前进2步 + 右转。整体效果是走一个正方形回到起点：',
          blocks: [
            {
              id: genId(),
              type: 'loop',
              repeatCount: 4,
              children: [
                { id: genId(), type: 'move' },
                { id: genId(), type: 'move' },
                { id: genId(), type: 'turnRight' },
              ],
            },
          ],
        },
        practiceTask:
          '👉 使用一个循环，让机器人走正方形：前进4步→右转，重复4次，最终回到起点！',
        checks: [
          {
            id: 'c1',
            type: 'usesLoop',
            description: '使用了循环指令',
            required: true,
          },
          {
            id: 'c2',
            type: 'usesBlockType',
            blockType: 'turnRight',
            description: '使用了"右转"指令',
            required: true,
          },
          {
            id: 'c3',
            type: 'reachesGoal',
            description: '机器人成功到达终点（起点）',
            required: true,
          },
          {
            id: 'c4',
            type: 'maxBlockCount',
            count: 6,
            description: '使用不超过6个指令块',
            required: false,
          },
        ],
        feedbackCorrect:
          '🎉 完美！你已经掌握了循环的高级用法，可以用它画出各种图形了！',
        feedbackWrong:
          '💪 再试一次！循环里放前进和右转，重复4次应该就能走一圈了。',
      },
    ],
    level: {
      id: 'tutorial-loop-level',
      name: '循环教学',
      description: '用于循环教学的地图',
      difficulty: 2,
      width: 5,
      height: 5,
      grid: makeGrid(5, 5),
      start: { x: 0, y: 0 },
      startDirection: 1,
      goal: { x: 0, y: 0 },
      stars: [],
      allowedBlocks: ['move', 'turnLeft', 'turnRight', 'loop'],
      maxBlocks: 10,
    },
    author: 'CodeRobot Team',
    createdAt: Date.now(),
  },
];
