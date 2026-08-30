import type { DrawTemplate } from '../types'
import { animalTemplates } from './animalTemplates'

/** 更逼真的分步简笔画（逻辑坐标 800×450） */
export const shapeTemplates: DrawTemplate[] = [
  ...animalTemplates,

  // —— 自然 ——
  {
    id: 'flower',
    title: '小花',
    category: 'nature',
    preview: '🌸',
    steps: [
      {
        label: '花心',
        guides: [{ d: 'M 400 200 a 28 28 0 1 1 0.1 0' }],
        solids: [{ d: 'M 400 200 a 18 18 0 1 1 0.1 0', fill: '#f5d547' }],
      },
      {
        label: '花瓣',
        guides: [
          { d: 'M 400 145 a 36 40 0 1 1 0.1 0' },
          { d: 'M 450 200 a 36 40 0 1 1 0.1 0' },
          { d: 'M 400 255 a 36 40 0 1 1 0.1 0' },
          { d: 'M 350 200 a 36 40 0 1 1 0.1 0' },
          { d: 'M 435 155 a 34 38 0 1 1 0.1 0' },
          { d: 'M 435 245 a 34 38 0 1 1 0.1 0' },
          { d: 'M 365 245 a 34 38 0 1 1 0.1 0' },
          { d: 'M 365 155 a 34 38 0 1 1 0.1 0' },
        ],
      },
      {
        label: '茎和叶',
        guides: [{ d: 'M 400 255 L 400 400' }],
        solids: [
          { d: 'M 400 330 Q 340 300 310 360 Q 360 350 400 340', fill: '#5faf4a', stroke: '#3d8030', strokeWidth: 2 },
          { d: 'M 400 350 Q 460 320 490 370 Q 440 365 400 360', fill: '#5faf4a', stroke: '#3d8030', strokeWidth: 2 },
          { d: 'M 390 195 a 4 5 0 1 0 0.1 0', fill: '#2a2a2a' },
          { d: 'M 410 195 a 4 5 0 1 0 0.1 0', fill: '#2a2a2a' },
          { d: 'M 390 215 Q 400 225 410 215', stroke: '#2a2a2a', strokeWidth: 2, fill: 'none' },
        ],
      },
    ],
  },
  {
    id: 'mushroom',
    title: '蘑菇',
    category: 'nature',
    preview: '🍄',
    steps: [
      {
        label: '菌盖',
        guides: [{ d: 'M 250 220 C 250 120 550 120 550 220 L 250 220' }],
      },
      {
        label: '菌柄',
        guides: [{ d: 'M 340 220 L 345 380 C 370 410 430 410 455 380 L 460 220' }],
      },
      {
        label: '草地',
        guides: [
          { d: 'M 280 390 Q 310 365 340 395' },
          { d: 'M 380 405 Q 410 370 440 400' },
          { d: 'M 470 390 Q 500 365 530 395' },
        ],
        solids: [
          { d: 'M 380 290 a 8 10 0 1 0 0.1 0', fill: '#2a2a2a' },
          { d: 'M 420 290 a 8 10 0 1 0 0.1 0', fill: '#2a2a2a' },
          { d: 'M 390 315 Q 400 328 410 315', stroke: '#2a2a2a', strokeWidth: 2, fill: 'none' },
        ],
      },
    ],
  },
  {
    id: 'tree',
    title: '大树',
    category: 'nature',
    preview: '🌳',
    steps: [
      {
        label: '树冠',
        guides: [{ d: 'M 400 80 C 300 85 240 160 265 230 C 210 250 215 330 300 345 C 280 400 350 430 400 410 C 450 430 520 400 500 345 C 585 330 590 250 535 230 C 560 160 500 85 400 80 Z' }],
      },
      {
        label: '树干',
        guides: [{ d: 'M 370 380 L 365 450 L 435 450 L 430 380' }],
      },
    ],
  },
  {
    id: 'sun',
    title: '太阳',
    category: 'nature',
    preview: '☀️',
    steps: [
      {
        label: '圆脸',
        guides: [{ d: 'M 400 225 a 85 85 0 1 1 0.1 0' }],
      },
      {
        label: '光芒',
        guides: [{ d: 'M 400 80 L 400 120 M 400 330 L 400 370 M 250 225 L 290 225 M 510 225 L 550 225 M 295 120 L 325 150 M 475 300 L 505 330 M 295 330 L 325 300 M 475 150 L 505 120' }],
      },
      {
        label: '笑脸',
        solids: [
          { d: 'M 365 200 a 12 14 0 1 0 0.1 0', fill: '#2a2a2a' },
          { d: 'M 435 200 a 12 14 0 1 0 0.1 0', fill: '#2a2a2a' },
          { d: 'M 360 250 Q 400 290 440 250', stroke: '#2a2a2a', strokeWidth: 4, fill: 'none' },
        ],
      },
    ],
  },
  {
    id: 'cloud',
    title: '云朵',
    category: 'nature',
    preview: '☁️',
    steps: [
      {
        label: '云朵外形',
        guides: [{ d: 'M 230 280 C 200 230 250 175 320 185 C 340 130 440 125 480 175 C 550 150 620 200 600 260 C 650 290 620 350 540 340 L 260 340 C 200 340 200 300 230 280 Z' }],
      },
    ],
  },
  {
    id: 'rainbow',
    title: '彩虹',
    category: 'nature',
    preview: '🌈',
    steps: [
      { label: '外弧', guides: [{ d: 'M 140 380 Q 400 40 660 380' }] },
      { label: '中弧', guides: [{ d: 'M 180 380 Q 400 90 620 380' }] },
      { label: '内弧', guides: [{ d: 'M 220 380 Q 400 140 580 380' }] },
      { label: '最内弧', guides: [{ d: 'M 260 380 Q 400 190 540 380' }] },
    ],
  },
  {
    id: 'leaf',
    title: '树叶',
    category: 'nature',
    preview: '🍃',
    steps: [
      {
        label: '叶片',
        guides: [{ d: 'M 400 70 C 540 160 540 340 400 420 C 260 340 260 160 400 70 Z' }],
      },
      {
        label: '叶脉',
        guides: [
          { d: 'M 400 90 L 400 400' },
          { d: 'M 400 180 L 320 150 M 400 230 L 480 200 M 400 280 L 330 300 M 400 330 L 470 310' },
        ],
      },
    ],
  },
  {
    id: 'mountain',
    title: '大山',
    category: 'nature',
    preview: '⛰️',
    steps: [
      {
        label: '主峰',
        guides: [{ d: 'M 80 400 L 280 100 L 400 280 L 520 70 L 720 400 Z' }],
      },
      {
        label: '雪顶',
        guides: [
          { d: 'M 240 170 L 280 100 L 320 170 Z' },
          { d: 'M 480 140 L 520 70 L 560 140 Z' },
        ],
      },
    ],
  },

  // —— 机械 ——
  {
    id: 'car',
    title: '小汽车',
    category: 'machine',
    preview: '🚗',
    steps: [
      {
        label: '车身',
        guides: [{ d: 'M 140 300 L 190 220 L 320 195 L 500 195 L 600 260 L 660 265 L 660 335 L 140 335 Z' }],
      },
      {
        label: '车窗',
        solids: [
          { d: 'M 230 225 L 330 210 L 330 275 L 205 290 Z', fill: '#8fd3f4', stroke: '#3a8fc0', strokeWidth: 2 },
          { d: 'M 350 208 L 490 208 L 560 265 L 350 275 Z', fill: '#8fd3f4', stroke: '#3a8fc0', strokeWidth: 2 },
        ],
      },
      {
        label: '轮子',
        guides: [
          { d: 'M 250 335 a 42 42 0 1 1 0.1 0' },
          { d: 'M 540 335 a 42 42 0 1 1 0.1 0' },
        ],
        solids: [
          { d: 'M 250 335 a 16 16 0 1 1 0.1 0', fill: '#666' },
          { d: 'M 540 335 a 16 16 0 1 1 0.1 0', fill: '#666' },
        ],
      },
    ],
  },
  {
    id: 'rocket',
    title: '火箭',
    category: 'machine',
    preview: '🚀',
    steps: [
      {
        label: '箭体',
        guides: [{ d: 'M 400 60 L 470 200 L 470 340 L 330 340 L 330 200 Z' }],
      },
      {
        label: '翼',
        guides: [
          { d: 'M 330 290 L 250 390 L 330 360' },
          { d: 'M 470 290 L 550 390 L 470 360' },
        ],
      },
      {
        label: '喷火窗',
        guides: [{ d: 'M 350 340 L 375 410 L 400 360 L 425 410 L 450 340' }],
        solids: [
          { d: 'M 400 230 a 28 28 0 1 1 0.1 0', fill: '#8fd3f4', stroke: '#3a8fc0', strokeWidth: 3 },
        ],
      },
    ],
  },
  {
    id: 'plane',
    title: '小飞机',
    category: 'machine',
    preview: '✈️',
    steps: [
      {
        label: '机身',
        guides: [{ d: 'M 150 230 C 200 210 480 195 620 225 C 640 230 640 245 620 250 C 480 275 200 265 150 245 Z' }],
      },
      {
        label: '机翼',
        guides: [
          { d: 'M 380 215 L 300 110 L 420 210' },
          { d: 'M 380 255 L 300 360 L 420 260' },
        ],
      },
      {
        label: '尾翼',
        guides: [
          { d: 'M 180 220 L 130 160 L 200 225' },
          { d: 'M 180 250 L 130 310 L 200 250' },
        ],
      },
    ],
  },
  {
    id: 'train',
    title: '火车',
    category: 'machine',
    preview: '🚂',
    steps: [
      {
        label: '车头车厢',
        guides: [
          { d: 'M 130 200 L 290 200 L 290 340 L 130 340 Z' },
          { d: 'M 290 250 L 530 250 L 530 340 L 290 340 Z' },
          { d: 'M 530 270 L 650 270 L 650 340 L 530 340 Z' },
        ],
      },
      {
        label: '烟囱窗户',
        guides: [{ d: 'M 190 140 L 190 200 M 165 140 L 215 140' }],
        solids: [
          { d: 'M 155 225 L 265 225 L 265 295 L 155 295 Z', fill: '#8fd3f4', stroke: '#3a8fc0', strokeWidth: 2 },
        ],
      },
      {
        label: '轮子',
        guides: [
          { d: 'M 190 340 a 30 30 0 1 1 0.1 0' },
          { d: 'M 360 340 a 30 30 0 1 1 0.1 0' },
          { d: 'M 470 340 a 30 30 0 1 1 0.1 0' },
          { d: 'M 590 340 a 28 28 0 1 1 0.1 0' },
        ],
      },
    ],
  },
  {
    id: 'robot',
    title: '机器人',
    category: 'machine',
    preview: '🤖',
    steps: [
      {
        label: '头',
        guides: [{ d: 'M 330 100 L 470 100 L 470 210 L 330 210 Z' }],
        solids: [
          { d: 'M 365 145 a 16 18 0 1 0 0.1 0', fill: '#5bb5f0' },
          { d: 'M 435 145 a 16 18 0 1 0 0.1 0', fill: '#5bb5f0' },
          { d: 'M 370 180 L 430 180', stroke: '#5c3d1e', strokeWidth: 3, fill: 'none' },
        ],
      },
      {
        label: '天线身体',
        guides: [
          { d: 'M 400 70 L 400 100' },
          { d: 'M 310 225 L 490 225 L 490 370 L 310 370 Z' },
        ],
      },
      {
        label: '手脚',
        guides: [
          { d: 'M 310 260 L 240 210 L 235 300 L 310 320' },
          { d: 'M 490 260 L 560 210 L 565 300 L 490 320' },
          { d: 'M 350 370 L 350 430 M 450 370 L 450 430' },
        ],
      },
    ],
  },
  {
    id: 'bike',
    title: '自行车',
    category: 'machine',
    preview: '🚲',
    steps: [
      {
        label: '轮子',
        guides: [
          { d: 'M 210 310 a 60 60 0 1 1 0.1 0' },
          { d: 'M 540 310 a 60 60 0 1 1 0.1 0' },
        ],
      },
      {
        label: '车架',
        guides: [
          { d: 'M 210 310 L 360 170 L 500 310' },
          { d: 'M 360 170 L 430 170' },
          { d: 'M 360 170 L 290 310' },
          { d: 'M 290 310 L 430 220 L 500 310' },
        ],
      },
    ],
  },
  {
    id: 'submarine',
    title: '潜水艇',
    category: 'machine',
    preview: '🚤',
    steps: [
      {
        label: '艇身',
        guides: [{ d: 'M 150 250 C 150 175 280 140 400 140 C 520 140 650 175 650 250 C 650 325 520 360 400 360 C 280 360 150 325 150 250 Z' }],
      },
      {
        label: '瞭望台',
        guides: [{ d: 'M 350 140 L 350 85 L 450 85 L 450 140 M 400 85 L 400 55' }],
      },
      {
        label: '舷窗推进器',
        guides: [{ d: 'M 650 250 L 740 225 L 740 275 Z' }],
        solids: [
          { d: 'M 280 240 a 20 20 0 1 0 0.1 0', fill: '#8fd3f4', stroke: '#3a8fc0', strokeWidth: 2 },
          { d: 'M 370 240 a 20 20 0 1 0 0.1 0', fill: '#8fd3f4', stroke: '#3a8fc0', strokeWidth: 2 },
          { d: 'M 460 240 a 20 20 0 1 0 0.1 0', fill: '#8fd3f4', stroke: '#3a8fc0', strokeWidth: 2 },
        ],
      },
    ],
  },
  {
    id: 'helicopter',
    title: '直升机',
    category: 'machine',
    preview: '🚁',
    steps: [
      {
        label: '机舱',
        guides: [
          { d: 'M 280 230 L 520 230 L 545 300 L 255 300 Z' },
          { d: 'M 320 175 L 490 175 L 515 230 L 295 230 Z' },
        ],
      },
      {
        label: '旋翼',
        guides: [{ d: 'M 160 195 L 640 195 M 400 195 L 400 175' }],
      },
      {
        label: '起落架尾翼',
        guides: [
          { d: 'M 270 300 L 245 360 M 510 300 L 535 360 M 230 360 L 550 360' },
          { d: 'M 545 265 L 670 250 L 670 280 Z' },
        ],
      },
    ],
  },
]
