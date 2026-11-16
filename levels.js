// 20 Solver-Certified Progressive 100%-All-Dry Levels across 4 Chapters
// Generated & verified via solver.js + generator.js

export const CHAPTER_META = [
  { chapter: 1, stage: "初晴迎风", name: "卷一 · 初晴迎风", desc: "认识四向来风与薄厚衣物" },
  { chapter: 2, stage: "满院衣裳", name: "卷二 · 满院衣裳", desc: "架上已有湿衣，学会借风让位" },
  { chapter: 3, stage: "橘荫挡风", name: "卷三 · 橘荫挡风", desc: "绕开盆栽风影，提前两轮布局" },
  { chapter: 4, stage: "巧手移夹", name: "卷四 · 巧手移夹", desc: "必用移衣木夹化解绝境的精妙残局" },
];

export const LEVELS = [
  {
    "id": "L1",
    "num": 1,
    "chapter": 1,
    "stage": "初晴迎风",
    "title": "西风拂面",
    "subtitle": "西风从左往右吹，把两件薄衫挂在不同排",
    "gustEvery": 2,
    "tickets": 0,
    "obstacles": [],
    "initialItems": [],
    "queue": [
      "L",
      "L"
    ],
    "winds": [
      "W"
    ],
    "requireAllDry": true,
    "difficulty": 11,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          0
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            0
          ]
        }
      ],
      "minClipsRequired": 0,
      "totalGarments": 2,
      "totalWetness": 2,
      "maxWindHits": 3,
      "tightness": 0.67,
      "firstStepPrecision": 1,
      "winningFirstChoices": 9,
      "totalFirstChoices": 9,
      "greedyWinRate": 1,
      "randomWinRate": 0.758,
      "difficultyScore": 11,
      "statesExplored": 2
    }
  },
  {
    "id": "L2",
    "num": 2,
    "chapter": 1,
    "stage": "初晴迎风",
    "title": "北风穿廊",
    "subtitle": "北风从上往下吹，三列各挂一件就能全吹干",
    "gustEvery": 3,
    "tickets": 0,
    "obstacles": [],
    "initialItems": [],
    "queue": [
      "L",
      "L",
      "L"
    ],
    "winds": [
      "N"
    ],
    "requireAllDry": true,
    "difficulty": 22,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        }
      ],
      "minClipsRequired": 0,
      "totalGarments": 3,
      "totalWetness": 3,
      "maxWindHits": 3,
      "tightness": 1,
      "firstStepPrecision": 1,
      "winningFirstChoices": 9,
      "totalFirstChoices": 9,
      "greedyWinRate": 1,
      "randomWinRate": 0.279,
      "difficultyScore": 22,
      "statesExplored": 3
    }
  },
  {
    "id": "L3",
    "num": 3,
    "chapter": 1,
    "stage": "初晴迎风",
    "title": "厚衣迎双风",
    "subtitle": "厚衣有 2 滴水，要连吹两阵风才会干",
    "gustEvery": 2,
    "tickets": 0,
    "obstacles": [],
    "initialItems": [],
    "queue": [
      "H",
      "L",
      "L",
      "L"
    ],
    "winds": [
      "W",
      "N"
    ],
    "requireAllDry": true,
    "difficulty": 23,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        }
      ],
      "minClipsRequired": 0,
      "totalGarments": 4,
      "totalWetness": 5,
      "maxWindHits": 6,
      "tightness": 0.83,
      "firstStepPrecision": 1,
      "winningFirstChoices": 9,
      "totalFirstChoices": 9,
      "greedyWinRate": 1,
      "randomWinRate": 0.221,
      "difficultyScore": 23,
      "statesExplored": 4
    }
  },
  {
    "id": "L4",
    "num": 4,
    "chapter": 1,
    "stage": "初晴迎风",
    "title": "东西对流",
    "subtitle": "留意风向切换，别让新衣挡住半干的厚衣",
    "gustEvery": 2,
    "tickets": 0,
    "obstacles": [],
    "initialItems": [],
    "queue": [
      "H",
      "L",
      "H",
      "L",
      "L",
      "L"
    ],
    "winds": [
      "W",
      "E",
      "N"
    ],
    "requireAllDry": true,
    "difficulty": 29,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        }
      ],
      "minClipsRequired": 0,
      "totalGarments": 6,
      "totalWetness": 8,
      "maxWindHits": 9,
      "tightness": 0.89,
      "firstStepPrecision": 1,
      "winningFirstChoices": 9,
      "totalFirstChoices": 9,
      "greedyWinRate": 1,
      "randomWinRate": 0.063,
      "difficultyScore": 29,
      "statesExplored": 9
    }
  },
  {
    "id": "L5",
    "num": 5,
    "chapter": 1,
    "stage": "初晴迎风",
    "title": "四面晴风",
    "subtitle": "四向来风轮流吹过，算准每排的前后顺序",
    "gustEvery": 2,
    "tickets": 0,
    "obstacles": [],
    "initialItems": [],
    "queue": [
      "H",
      "H",
      "L",
      "H",
      "L",
      "L",
      "L",
      "L"
    ],
    "winds": [
      "W",
      "N",
      "E",
      "S"
    ],
    "requireAllDry": true,
    "difficulty": 31,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        }
      ],
      "minClipsRequired": 0,
      "totalGarments": 8,
      "totalWetness": 11,
      "maxWindHits": 12,
      "tightness": 0.92,
      "firstStepPrecision": 1,
      "winningFirstChoices": 9,
      "totalFirstChoices": 9,
      "greedyWinRate": 1,
      "randomWinRate": 0.067,
      "difficultyScore": 31,
      "statesExplored": 8
    }
  },
  {
    "id": "L6",
    "num": 6,
    "chapter": 2,
    "stage": "满院衣裳",
    "title": "院中留衣",
    "subtitle": "架上已有一件厚衣，留出它的迎风通道",
    "gustEvery": 1,
    "tickets": 0,
    "obstacles": [],
    "initialItems": [
      {
        "r": 2,
        "c": 0,
        "type": "H"
      },
      {
        "r": 2,
        "c": 2,
        "type": "H"
      },
      {
        "r": 1,
        "c": 1,
        "type": "L"
      },
      {
        "r": 0,
        "c": 0,
        "type": "L"
      }
    ],
    "queue": [
      "L",
      "L",
      "L"
    ],
    "winds": [
      "E",
      "W",
      "S"
    ],
    "requireAllDry": true,
    "difficulty": 35,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          1
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            1
          ]
        }
      ],
      "minClipsRequired": 0,
      "totalGarments": 7,
      "totalWetness": 9,
      "maxWindHits": 9,
      "tightness": 1,
      "firstStepPrecision": 0.8,
      "winningFirstChoices": 4,
      "totalFirstChoices": 5,
      "greedyWinRate": 0.8,
      "randomWinRate": 0.171,
      "difficultyScore": 35,
      "statesExplored": 3
    }
  },
  {
    "id": "L7",
    "num": 7,
    "chapter": 2,
    "stage": "满院衣裳",
    "title": "双衫待风",
    "subtitle": "先看清架上湿衣的位置，再落手挂衣",
    "gustEvery": 1,
    "tickets": 0,
    "obstacles": [],
    "initialItems": [
      {
        "r": 2,
        "c": 1,
        "type": "H"
      },
      {
        "r": 2,
        "c": 0,
        "type": "H"
      },
      {
        "r": 1,
        "c": 1,
        "type": "L"
      },
      {
        "r": 0,
        "c": 0,
        "type": "L"
      }
    ],
    "queue": [
      "L",
      "L",
      "L"
    ],
    "winds": [
      "S",
      "W",
      "S"
    ],
    "requireAllDry": true,
    "difficulty": 45,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        }
      ],
      "minClipsRequired": 0,
      "totalGarments": 7,
      "totalWetness": 9,
      "maxWindHits": 9,
      "tightness": 1,
      "firstStepPrecision": 0.6,
      "winningFirstChoices": 3,
      "totalFirstChoices": 5,
      "greedyWinRate": 0.6,
      "randomWinRate": 0.167,
      "difficultyScore": 45,
      "statesExplored": 4
    }
  },
  {
    "id": "L8",
    "num": 8,
    "chapter": 2,
    "stage": "满院衣裳",
    "title": "借风藏衣",
    "subtitle": "有时把薄衫藏在厚衣身后，反而能成全两件",
    "gustEvery": 1,
    "tickets": 0,
    "obstacles": [],
    "initialItems": [
      {
        "r": 2,
        "c": 0,
        "type": "H"
      },
      {
        "r": 0,
        "c": 0,
        "type": "H"
      },
      {
        "r": 1,
        "c": 2,
        "type": "L"
      },
      {
        "r": 1,
        "c": 1,
        "type": "L"
      }
    ],
    "queue": [
      "L",
      "L",
      "L"
    ],
    "winds": [
      "S",
      "W",
      "E"
    ],
    "requireAllDry": true,
    "difficulty": 54,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          1,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          0
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            1,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            0
          ]
        }
      ],
      "minClipsRequired": 0,
      "totalGarments": 7,
      "totalWetness": 9,
      "maxWindHits": 9,
      "tightness": 1,
      "firstStepPrecision": 0.6,
      "winningFirstChoices": 3,
      "totalFirstChoices": 5,
      "greedyWinRate": 0.35,
      "randomWinRate": 0.192,
      "difficultyScore": 54,
      "statesExplored": 7
    }
  },
  {
    "id": "L9",
    "num": 9,
    "chapter": 2,
    "stage": "满院衣裳",
    "title": "回廊错落",
    "subtitle": "四件旧衣在架，每一步都要算准下一阵风",
    "gustEvery": 1,
    "tickets": 0,
    "obstacles": [],
    "initialItems": [
      {
        "r": 1,
        "c": 1,
        "type": "H"
      },
      {
        "r": 2,
        "c": 0,
        "type": "H"
      },
      {
        "r": 1,
        "c": 0,
        "type": "L"
      },
      {
        "r": 0,
        "c": 0,
        "type": "L"
      }
    ],
    "queue": [
      "L",
      "L",
      "L"
    ],
    "winds": [
      "E",
      "S",
      "N"
    ],
    "requireAllDry": true,
    "difficulty": 62,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          1,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            1,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        }
      ],
      "minClipsRequired": 0,
      "totalGarments": 7,
      "totalWetness": 9,
      "maxWindHits": 9,
      "tightness": 1,
      "firstStepPrecision": 0.2,
      "winningFirstChoices": 1,
      "totalFirstChoices": 5,
      "greedyWinRate": 0.354,
      "randomWinRate": 0.033,
      "difficultyScore": 62,
      "statesExplored": 5
    }
  },
  {
    "id": "L10",
    "num": 10,
    "chapter": 2,
    "stage": "满院衣裳",
    "title": "满架生风",
    "subtitle": "零容错满风局，每一缕风都不能落空",
    "gustEvery": 1,
    "tickets": 0,
    "obstacles": [],
    "initialItems": [
      {
        "r": 0,
        "c": 0,
        "type": "H"
      },
      {
        "r": 1,
        "c": 1,
        "type": "H"
      },
      {
        "r": 2,
        "c": 0,
        "type": "L"
      },
      {
        "r": 0,
        "c": 1,
        "type": "L"
      }
    ],
    "queue": [
      "L",
      "L",
      "L"
    ],
    "winds": [
      "N",
      "W",
      "W"
    ],
    "requireAllDry": true,
    "difficulty": 68,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          0
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            0
          ]
        }
      ],
      "minClipsRequired": 0,
      "totalGarments": 7,
      "totalWetness": 9,
      "maxWindHits": 9,
      "tightness": 1,
      "firstStepPrecision": 0.6,
      "winningFirstChoices": 3,
      "totalFirstChoices": 5,
      "greedyWinRate": 0,
      "randomWinRate": 0.171,
      "difficultyScore": 68,
      "statesExplored": 3
    }
  },
  {
    "id": "L11",
    "num": 11,
    "chapter": 3,
    "stage": "橘荫挡风",
    "title": "橘影初现",
    "subtitle": "橘树盆栽会挡住身后的风，绕开树影挂衣",
    "gustEvery": 1,
    "tickets": 0,
    "obstacles": [
      [
        1,
        1
      ],
      [
        0,
        1
      ]
    ],
    "initialItems": [
      {
        "r": 1,
        "c": 0,
        "type": "H"
      },
      {
        "r": 1,
        "c": 2,
        "type": "H"
      }
    ],
    "queue": [
      "L",
      "L",
      "L"
    ],
    "winds": [
      "E",
      "N",
      "S"
    ],
    "requireAllDry": true,
    "difficulty": 72,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          1
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            1
          ]
        }
      ],
      "minClipsRequired": 0,
      "totalGarments": 5,
      "totalWetness": 7,
      "maxWindHits": 9,
      "tightness": 0.78,
      "firstStepPrecision": 0.8,
      "winningFirstChoices": 4,
      "totalFirstChoices": 5,
      "greedyWinRate": 0,
      "randomWinRate": 0.163,
      "difficultyScore": 72,
      "statesExplored": 4
    }
  },
  {
    "id": "L12",
    "num": 12,
    "chapter": 3,
    "stage": "橘荫挡风",
    "title": "斜阳树荫",
    "subtitle": "风向一变，原本的背风处也会变成迎风位",
    "gustEvery": 2,
    "tickets": 0,
    "obstacles": [
      [
        0,
        1
      ]
    ],
    "initialItems": [
      {
        "r": 0,
        "c": 0,
        "type": "H"
      },
      {
        "r": 2,
        "c": 2,
        "type": "L"
      }
    ],
    "queue": [
      "L",
      "L",
      "L",
      "L",
      "L",
      "L"
    ],
    "winds": [
      "S",
      "S",
      "E"
    ],
    "requireAllDry": true,
    "difficulty": 77,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          0
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            0
          ]
        }
      ],
      "minClipsRequired": 0,
      "totalGarments": 8,
      "totalWetness": 9,
      "maxWindHits": 9,
      "tightness": 1,
      "firstStepPrecision": 0.67,
      "winningFirstChoices": 4,
      "totalFirstChoices": 6,
      "greedyWinRate": 0,
      "randomWinRate": 0.025,
      "difficultyScore": 77,
      "statesExplored": 15
    }
  },
  {
    "id": "L13",
    "num": 13,
    "chapter": 3,
    "stage": "橘荫挡风",
    "title": "双橘夹道",
    "subtitle": "两盆绿植把晒场分成明暗两路，提前布局",
    "gustEvery": 2,
    "tickets": 0,
    "obstacles": [
      [
        2,
        2
      ],
      [
        1,
        1
      ]
    ],
    "initialItems": [
      {
        "r": 2,
        "c": 1,
        "type": "H"
      },
      {
        "r": 1,
        "c": 0,
        "type": "L"
      }
    ],
    "queue": [
      "L",
      "L",
      "L",
      "L",
      "L",
      "L"
    ],
    "winds": [
      "W",
      "N",
      "W"
    ],
    "requireAllDry": true,
    "difficulty": 79,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          0
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            0
          ]
        }
      ],
      "minClipsRequired": 0,
      "totalGarments": 8,
      "totalWetness": 9,
      "maxWindHits": 9,
      "tightness": 1,
      "firstStepPrecision": 0.8,
      "winningFirstChoices": 4,
      "totalFirstChoices": 5,
      "greedyWinRate": 0,
      "randomWinRate": 0.033,
      "difficultyScore": 79,
      "statesExplored": 6
    }
  },
  {
    "id": "L14",
    "num": 14,
    "chapter": 3,
    "stage": "橘荫挡风",
    "title": "曲径借风",
    "subtitle": "利用横竖风切换，让躲在树后的厚衣吹干",
    "gustEvery": 1,
    "tickets": 0,
    "obstacles": [
      [
        2,
        1
      ],
      [
        1,
        1
      ]
    ],
    "initialItems": [
      {
        "r": 0,
        "c": 0,
        "type": "H"
      },
      {
        "r": 0,
        "c": 2,
        "type": "L"
      }
    ],
    "queue": [
      "H",
      "L",
      "L"
    ],
    "winds": [
      "S",
      "E",
      "E"
    ],
    "requireAllDry": true,
    "difficulty": 80,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          1,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          2
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            1,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            2
          ]
        }
      ],
      "minClipsRequired": 0,
      "totalGarments": 5,
      "totalWetness": 7,
      "maxWindHits": 9,
      "tightness": 0.78,
      "firstStepPrecision": 0.4,
      "winningFirstChoices": 2,
      "totalFirstChoices": 5,
      "greedyWinRate": 0,
      "randomWinRate": 0.021,
      "difficultyScore": 80,
      "statesExplored": 8
    }
  },
  {
    "id": "L15",
    "num": 15,
    "chapter": 3,
    "stage": "橘荫挡风",
    "title": "深院穿堂",
    "subtitle": "一着不慎便会挡风，三思而后挂",
    "gustEvery": 2,
    "tickets": 0,
    "obstacles": [
      [
        1,
        1
      ],
      [
        0,
        1
      ]
    ],
    "initialItems": [
      {
        "r": 1,
        "c": 2,
        "type": "H"
      },
      {
        "r": 2,
        "c": 0,
        "type": "L"
      }
    ],
    "queue": [
      "L",
      "L",
      "L",
      "L",
      "L",
      "L"
    ],
    "winds": [
      "S",
      "W",
      "S"
    ],
    "requireAllDry": true,
    "difficulty": 82,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          1
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            1
          ]
        }
      ],
      "minClipsRequired": 0,
      "totalGarments": 8,
      "totalWetness": 9,
      "maxWindHits": 9,
      "tightness": 1,
      "firstStepPrecision": 0.6,
      "winningFirstChoices": 3,
      "totalFirstChoices": 5,
      "greedyWinRate": 0,
      "randomWinRate": 0.021,
      "difficultyScore": 82,
      "statesExplored": 7
    }
  },
  {
    "id": "L16",
    "num": 16,
    "chapter": 4,
    "stage": "巧手移夹",
    "title": "木夹初试",
    "subtitle": "点一下架上的衣服，用移衣木夹帮它换个迎风位",
    "gustEvery": 2,
    "tickets": 1,
    "obstacles": [
      [
        0,
        1
      ]
    ],
    "initialItems": [
      {
        "r": 0,
        "c": 2,
        "type": "H"
      },
      {
        "r": 2,
        "c": 2,
        "type": "L"
      }
    ],
    "queue": [
      "L",
      "L",
      "L",
      "L",
      "L",
      "L"
    ],
    "winds": [
      "W",
      "W",
      "E"
    ],
    "requireAllDry": true,
    "difficulty": 87,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "move",
        "from": [
          0,
          2
        ],
        "to": [
          1,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          0
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "move",
          "from": [
            0,
            2
          ],
          "to": [
            1,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            0
          ]
        }
      ],
      "minClipsRequired": 1,
      "totalGarments": 8,
      "totalWetness": 9,
      "maxWindHits": 9,
      "tightness": 1,
      "firstStepPrecision": 1,
      "winningFirstChoices": 6,
      "totalFirstChoices": 6,
      "greedyWinRate": 0,
      "randomWinRate": 0,
      "difficultyScore": 87,
      "statesExplored": 29
    }
  },
  {
    "id": "L17",
    "num": 17,
    "chapter": 4,
    "stage": "巧手移夹",
    "title": "出影迎风",
    "subtitle": "先在迎风位吹干一半，再夹去新风口收尾",
    "gustEvery": 2,
    "tickets": 1,
    "obstacles": [
      [
        1,
        1
      ],
      [
        0,
        0
      ]
    ],
    "initialItems": [
      {
        "r": 0,
        "c": 1,
        "type": "H"
      },
      {
        "r": 2,
        "c": 0,
        "type": "L"
      }
    ],
    "queue": [
      "L",
      "L",
      "L",
      "L",
      "L",
      "L"
    ],
    "winds": [
      "S",
      "E",
      "S"
    ],
    "requireAllDry": true,
    "difficulty": 91,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      },
      {
        "type": "move",
        "from": [
          0,
          1
        ],
        "to": [
          1,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          1,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          1
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        },
        {
          "type": "move",
          "from": [
            0,
            1
          ],
          "to": [
            1,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            1,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            1
          ]
        }
      ],
      "minClipsRequired": 1,
      "totalGarments": 8,
      "totalWetness": 9,
      "maxWindHits": 9,
      "tightness": 1,
      "firstStepPrecision": 1,
      "winningFirstChoices": 5,
      "totalFirstChoices": 5,
      "greedyWinRate": 0,
      "randomWinRate": 0,
      "difficultyScore": 91,
      "statesExplored": 30
    }
  },
  {
    "id": "L18",
    "num": 18,
    "chapter": 4,
    "stage": "巧手移夹",
    "title": "借位腾挪",
    "subtitle": "算准哪一件最需要木夹相助，好钢用在刀刃上",
    "gustEvery": 2,
    "tickets": 1,
    "obstacles": [
      [
        2,
        1
      ],
      [
        1,
        1
      ]
    ],
    "initialItems": [
      {
        "r": 0,
        "c": 0,
        "type": "H"
      },
      {
        "r": 2,
        "c": 0,
        "type": "L"
      }
    ],
    "queue": [
      "L",
      "L",
      "L",
      "L",
      "L",
      "L"
    ],
    "winds": [
      "E",
      "N",
      "E"
    ],
    "requireAllDry": true,
    "difficulty": 93,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          1
        ]
      },
      {
        "type": "move",
        "from": [
          0,
          0
        ],
        "to": [
          1,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          2
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            1
          ]
        },
        {
          "type": "move",
          "from": [
            0,
            0
          ],
          "to": [
            1,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            2
          ]
        }
      ],
      "minClipsRequired": 1,
      "totalGarments": 8,
      "totalWetness": 9,
      "maxWindHits": 9,
      "tightness": 1,
      "firstStepPrecision": 0.8,
      "winningFirstChoices": 4,
      "totalFirstChoices": 5,
      "greedyWinRate": 0,
      "randomWinRate": 0,
      "difficultyScore": 93,
      "statesExplored": 36
    }
  },
  {
    "id": "L19",
    "num": 19,
    "chapter": 4,
    "stage": "巧手移夹",
    "title": "双夹回旋",
    "subtitle": "两枚木夹缺一不可，步步环环相扣",
    "gustEvery": 1,
    "tickets": 2,
    "obstacles": [
      [
        2,
        1
      ],
      [
        1,
        1
      ]
    ],
    "initialItems": [
      {
        "r": 2,
        "c": 2,
        "type": "H"
      },
      {
        "r": 1,
        "c": 2,
        "type": "H"
      }
    ],
    "queue": [
      "L",
      "L",
      "L"
    ],
    "winds": [
      "W",
      "E",
      "W"
    ],
    "requireAllDry": true,
    "difficulty": 97,
    "witnessActions": [
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          0
        ]
      },
      {
        "type": "move",
        "from": [
          1,
          2
        ],
        "to": [
          0,
          0
        ]
      },
      {
        "type": "move",
        "from": [
          2,
          2
        ],
        "to": [
          1,
          0
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          0
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            0
          ]
        },
        {
          "type": "move",
          "from": [
            1,
            2
          ],
          "to": [
            0,
            0
          ]
        },
        {
          "type": "move",
          "from": [
            2,
            2
          ],
          "to": [
            1,
            0
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            0
          ]
        }
      ],
      "minClipsRequired": 2,
      "totalGarments": 5,
      "totalWetness": 7,
      "maxWindHits": 9,
      "tightness": 0.78,
      "firstStepPrecision": 1,
      "winningFirstChoices": 5,
      "totalFirstChoices": 5,
      "greedyWinRate": 0,
      "randomWinRate": 0,
      "difficultyScore": 99,
      "statesExplored": 76
    }
  },
  {
    "id": "L20",
    "num": 20,
    "chapter": 4,
    "stage": "巧手移夹",
    "title": "晴日满庭",
    "subtitle": "终极试炼：借四方晴风，收尽满院衣裳",
    "gustEvery": 1,
    "tickets": 2,
    "obstacles": [
      [
        1,
        2
      ],
      [
        0,
        0
      ]
    ],
    "initialItems": [
      {
        "r": 1,
        "c": 0,
        "type": "H"
      },
      {
        "r": 0,
        "c": 2,
        "type": "H"
      }
    ],
    "queue": [
      "L",
      "L",
      "L"
    ],
    "winds": [
      "S",
      "N",
      "N"
    ],
    "requireAllDry": true,
    "difficulty": 99,
    "witnessActions": [
      {
        "type": "move",
        "from": [
          0,
          2
        ],
        "to": [
          0,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          2,
          2
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      },
      {
        "type": "move",
        "from": [
          1,
          0
        ],
        "to": [
          0,
          1
        ]
      },
      {
        "type": "place",
        "at": [
          0,
          2
        ]
      }
    ],
    "metrics": {
      "solvable": true,
      "witnessActions": [
        {
          "type": "move",
          "from": [
            0,
            2
          ],
          "to": [
            0,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            2,
            2
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        },
        {
          "type": "move",
          "from": [
            1,
            0
          ],
          "to": [
            0,
            1
          ]
        },
        {
          "type": "place",
          "at": [
            0,
            2
          ]
        }
      ],
      "minClipsRequired": 2,
      "totalGarments": 5,
      "totalWetness": 7,
      "maxWindHits": 9,
      "tightness": 0.78,
      "firstStepPrecision": 0,
      "winningFirstChoices": 0,
      "totalFirstChoices": 5,
      "greedyWinRate": 0,
      "randomWinRate": 0,
      "difficultyScore": 99,
      "statesExplored": 208
    }
  }
];
