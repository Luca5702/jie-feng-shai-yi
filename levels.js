// 15 Verified Level Configurations (3 Tutorials + 12 Standard/Challenge Levels)
// Every level includes a pre-verified reachable witness sequence (可达见证路径).

export const LEVELS = [
  {
    "id": "T1",
    "stage": "新手教学",
    "title": "教学 1 · 初识迎风",
    "subtitle": "0–15 秒：先理解一次吹干",
    "focus": "点选薄衣 L 放入不同行的迎风格，观察西风（左→右）吹干收衣得分。",
    "queue": [
      "L",
      "L"
    ],
    "winds": [
      "W"
    ],
    "gustEvery": 2,
    "tickets": 0,
    "target": 4,
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
    "witnessScore": 4,
    "maxFoundScore": 4
  },
  {
    "id": "T2",
    "stage": "新手教学",
    "title": "教学 2 · 前排挡风",
    "subtitle": "15–30 秒：亲眼看到遮挡",
    "focus": "每条扫描线只吹第一件衣物，本阵不穿透。将三件薄衣分列摆放以全部受风。",
    "queue": [
      "L",
      "L",
      "L"
    ],
    "winds": [
      "N"
    ],
    "gustEvery": 3,
    "tickets": 0,
    "target": 6,
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
    "witnessScore": 6,
    "maxFoundScore": 6
  },
  {
    "id": "T3",
    "stage": "新手教学",
    "title": "教学 3 · 厚衣跨阵与挪位",
    "subtitle": "30–45 秒：发现厚衣要两阵",
    "focus": "厚衣 H 湿度为 2，需跨两阵受风才收走（+5 分）。可利用角落或挪位券让厚衣连吃两阵风。",
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
    "gustEvery": 2,
    "tickets": 1,
    "target": 9,
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
    "witnessScore": 11,
    "maxFoundScore": 11
  },
  {
    "id": "L1",
    "stage": "早期标准",
    "title": "第 1 关 · 四向回旋（策划书标准算例）",
    "subtitle": "对应策划书 08 节完整可复算示例",
    "focus": "四阵风依次为西、北、东、南。注意第三阵东风虽不立即得分，但能为南风准备两件半干厚衣。",
    "queue": [
      "H",
      "H",
      "H",
      "L",
      "L",
      "L",
      "H",
      "H",
      "H",
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
    "gustEvery": 3,
    "tickets": 2,
    "target": 20,
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
          2,
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
          2,
          1
        ]
      }
    ],
    "witnessScore": 21,
    "maxFoundScore": 27
  },
  {
    "id": "L2",
    "stage": "早期标准",
    "title": "第 2 关 · 晨风穿堂",
    "subtitle": "厚薄交替队列，学会让不同扫描线受风",
    "focus": "薄衣吃一风即腾空，可作为前排临时接风并在下一阵露出后排厚衣。",
    "queue": [
      "L",
      "H",
      "L",
      "H",
      "L",
      "H",
      "L",
      "H",
      "L",
      "H",
      "L",
      "H"
    ],
    "winds": [
      "N",
      "W",
      "S",
      "E"
    ],
    "gustEvery": 3,
    "tickets": 2,
    "target": 21,
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
          0
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
          2,
          0
        ]
      }
    ],
    "witnessScore": 22,
    "maxFoundScore": 22
  },
  {
    "id": "L3",
    "stage": "早期标准",
    "title": "第 3 关 · 双西晒台",
    "subtitle": "连续两阵同向西风，前排厚衣直通收衣",
    "focus": "前两阵均为西风！第一轮把厚衣摆在左侧迎风列，第二阵继续受风即可直接收走 3 件厚衣。",
    "queue": [
      "H",
      "L",
      "H",
      "L",
      "H",
      "L",
      "H",
      "L",
      "H",
      "L",
      "H",
      "L"
    ],
    "winds": [
      "W",
      "W",
      "N",
      "E"
    ],
    "gustEvery": 3,
    "tickets": 2,
    "target": 22,
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
          0,
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
          1,
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
      }
    ],
    "witnessScore": 27,
    "maxFoundScore": 27
  },
  {
    "id": "L4",
    "stage": "中期进阶",
    "title": "第 4 关 · 南北对流",
    "subtitle": "先北后南，两端迎风中排蓄力",
    "focus": "北风与南风分别扫上下两端。注意不要把薄衣塞在会被厚衣挡住的中腹。",
    "queue": [
      "H",
      "H",
      "L",
      "H",
      "L",
      "H",
      "L",
      "H",
      "H",
      "L",
      "L",
      "L"
    ],
    "winds": [
      "N",
      "S",
      "W",
      "E"
    ],
    "gustEvery": 3,
    "tickets": 2,
    "target": 24,
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
          2
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
          1,
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
    "witnessScore": 28,
    "maxFoundScore": 28
  },
  {
    "id": "L5",
    "stage": "中期进阶",
    "title": "第 5 关 · 厚衣先至",
    "subtitle": "前六件全为厚衣，考验空间腾挪",
    "focus": "前两轮全是厚衣 H，若第一阵只吹半干而第二阵换向，盘面极易拥堵。利用对角与挪位腾出通道。",
    "queue": [
      "H",
      "H",
      "H",
      "H",
      "H",
      "H",
      "L",
      "L",
      "L",
      "L",
      "L",
      "L"
    ],
    "winds": [
      "W",
      "E",
      "N",
      "S"
    ],
    "gustEvery": 3,
    "tickets": 2,
    "target": 24,
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
        "type": "move",
        "from": [
          2,
          0
        ],
        "to": [
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
      }
    ],
    "witnessScore": 27,
    "maxFoundScore": 27
  },
  {
    "id": "L6",
    "stage": "中期进阶",
    "title": "第 6 关 · 顺风借位",
    "subtitle": "东风起手，逆时针四向轮转",
    "focus": "从右侧第 3 列开始布局，预留北风顶行与西风左列的接力受风位。",
    "queue": [
      "L",
      "L",
      "H",
      "H",
      "L",
      "H",
      "H",
      "L",
      "L",
      "H",
      "H",
      "L"
    ],
    "winds": [
      "E",
      "N",
      "W",
      "S"
    ],
    "gustEvery": 3,
    "tickets": 2,
    "target": 22,
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
          0,
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
          1
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
    "witnessScore": 22,
    "maxFoundScore": 22
  },
  {
    "id": "L7",
    "stage": "中期进阶",
    "title": "第 7 关 · 斜阳长廊",
    "subtitle": "南风两度来袭，底行成为核心战场",
    "focus": "第 1、3 阵都是南风。底行是高频风口，把半干厚衣留在第 3 行迎风面收益最高。",
    "queue": [
      "H",
      "L",
      "H",
      "H",
      "L",
      "H",
      "L",
      "H",
      "L",
      "L",
      "H",
      "L"
    ],
    "winds": [
      "S",
      "W",
      "S",
      "E"
    ],
    "gustEvery": 3,
    "tickets": 2,
    "target": 25,
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
          1,
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
          1
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
      }
    ],
    "witnessScore": 27,
    "maxFoundScore": 27
  },
  {
    "id": "L8",
    "stage": "中期进阶",
    "title": "第 8 关 · 连风压境",
    "subtitle": "北风二连后转东南，顶行快速周转",
    "focus": "利用前两阵连续北风清空顶行厚衣，为后两阵东、南风腾出右列与底行。",
    "queue": [
      "L",
      "H",
      "H",
      "L",
      "H",
      "H",
      "H",
      "L",
      "L",
      "H",
      "L",
      "L"
    ],
    "winds": [
      "N",
      "N",
      "E",
      "S"
    ],
    "gustEvery": 3,
    "tickets": 2,
    "target": 26,
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
      },
      {
        "type": "place",
        "at": [
          2,
          0
        ]
      }
    ],
    "witnessScore": 27,
    "maxFoundScore": 27
  },
  {
    "id": "L9",
    "stage": "后期挑战",
    "title": "第 9 关 · 腾笼换鸟（挑战）",
    "subtitle": "善用 2 张挪位券，把半干厚衣推上风口",
    "focus": "高目标挑战：当半干厚衣被困在内侧或背风面时，果断使用挪位券将其移至下一阵迎风首格。",
    "queue": [
      "H",
      "H",
      "L",
      "H",
      "H",
      "L",
      "H",
      "H",
      "L",
      "L",
      "L",
      "L"
    ],
    "winds": [
      "W",
      "N",
      "W",
      "S"
    ],
    "gustEvery": 3,
    "tickets": 2,
    "target": 27,
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
          1
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
          1
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
          0,
          2
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
    "witnessScore": 28,
    "maxFoundScore": 28
  },
  {
    "id": "L10",
    "stage": "后期挑战",
    "title": "第 10 关 · 逆风回廊（挑战）",
    "subtitle": "薄衣开局、中段六件厚衣连发",
    "focus": "首阵东风先清空三件薄衣拿满 6 分并保持空盘，随后全力规划六件厚衣的跨阵受风。",
    "queue": [
      "L",
      "L",
      "L",
      "H",
      "H",
      "H",
      "H",
      "H",
      "H",
      "L",
      "L",
      "L"
    ],
    "winds": [
      "E",
      "S",
      "W",
      "N"
    ],
    "gustEvery": 3,
    "tickets": 2,
    "target": 27,
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
          2,
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
    "witnessScore": 27,
    "maxFoundScore": 27
  },
  {
    "id": "L11",
    "stage": "后期挑战",
    "title": "第 11 关 · 三面来风（挑战）",
    "subtitle": "北—东—北—西，唯有北侧出现两次",
    "focus": "没有南风！底行（第 3 行）只有在列扫描空缺或东西风首格时才能受风，切勿在底行堆积厚衣。",
    "queue": [
      "H",
      "L",
      "H",
      "H",
      "H",
      "L",
      "L",
      "H",
      "H",
      "L",
      "L",
      "L"
    ],
    "winds": [
      "N",
      "E",
      "N",
      "W"
    ],
    "gustEvery": 3,
    "tickets": 2,
    "target": 28,
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
          2,
          1
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
    "witnessScore": 28,
    "maxFoundScore": 28
  },
  {
    "id": "L12",
    "stage": "后期挑战",
    "title": "第 12 关 · 借风收衣（终极挑战）",
    "subtitle": "南—东—北—西，精准调度每一张挪位券",
    "focus": "终极考核：主动接受蓄力回合，配合两次关键挪位，在第四阵西风完成全行清场收衣。",
    "queue": [
      "H",
      "H",
      "H",
      "H",
      "L",
      "L",
      "H",
      "H",
      "L",
      "L",
      "L",
      "L"
    ],
    "winds": [
      "S",
      "E",
      "N",
      "W"
    ],
    "gustEvery": 3,
    "tickets": 2,
    "target": 27,
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
      },
      {
        "type": "place",
        "at": [
          2,
          0
        ]
      }
    ],
    "witnessScore": 27,
    "maxFoundScore": 27
  }
];
