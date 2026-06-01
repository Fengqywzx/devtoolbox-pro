/**
 * LangSystem v5 — 语言共情引擎
 * 提供共情回应、方言支持、情绪检测、法律术语白话翻译
 * 依赖：无
 */
class LangSystem {
  constructor(projectId, options = {}) {
    this.projectId = projectId;
    this.dialects = {};
    this.customPhrases = {};
    this._initDefaults(options);
  }

  _initDefaults(options) {
    // 共情短语库 — 12种情绪 × 多场景
    this.empathyDB = {
      angry: {
        wage_arrears: [
          '这口气我替你憋得慌。欠薪的事，咱有理有据，一步一步来算。',
          '换谁都得生气。你先喘口气，我陪你理清楚。',
          '欠钱不还，天理难容。我帮你把这笔账算明白。'
        ],
        injustice: [
          '这事确实不公。但你不是一个人在面对，我陪着你。',
          '愤怒是因为你在乎公平。这份愤怒，正是改变的开始。'
        ],
        default: [
          '换谁都得生气。你先喘口气，我陪你理清楚。',
          '气头上先别急，咱们把事实捋清楚再说。'
        ]
      },
      anxious: {
        deadline: [
          '别慌。时间紧不代表做不好，咱们挑最重要的先办。',
          '越是紧急的时候，越要稳住。分步骤来，一件一件做。'
        ],
        interview: [
          '紧张很正常。就当是跟朋友聊天，想到什么说什么。',
          '不用怕说错，你说出来的每句话我都在认真听。'
        ],
        default: [
          '不急，有我在这儿帮你理。一步一步走，不会漏。',
          '心慌的时候，深呼吸三次。然后我们从头开始。'
        ]
      },
      tired: {
        night_shift: [
          '又熬了一宿吧。辛苦你了，先记几个关键的，剩下的明天再说。',
          '身体是自己的本钱。今天先歇，明天咱继续。'
        ],
        long_hours: [
          '干了一天活，身体肯定累了。先歇口气再弄。',
          '你付出的每一分力气，都值得被看见。歇一会儿。'
        ],
        default: [
          '累了就歇。机器还需要保养，何况是人呢。',
          '你今天已经做了很多了。好好休息，明天再继续。'
        ]
      },
      sad: {
        lost_job: [
          '丢了工作不是你的错。这个阶段很难，但不会一直这样。',
          '暂时的低谷，不代表你不行。咱们一起看看下一步。'
        ],
        default: [
          '心里难受是正常的。能说出来就好受些，我听着。',
          '有时候哭一哭反而好。你不需要一直坚强。'
        ]
      },
      fearful: {
        retaliation: [
          '怕被报复是人之常情。但法律站在你这边，你有权维护自己。',
          '恐惧不是懦弱，是身体在告诉你需要保护。我们先确保你的安全。'
        ],
        default: [
          '害怕是正常的。但你不是一个人面对，有法律、有渠道、有办法。',
          '别怕。一步一步来，我会陪着你走完每一步。'
        ]
      },
      grateful: {
        default: [
          '你这份心，我替你记下了。有时候一句话就能撑人很久。',
          '感恩的心是最温暖的。你的善意会被看见的。'
        ]
      },
      hopeful: {
        default: [
          '有希望就有力量。咱们趁这股劲，多推进几步。',
          '看到希望的时候，脚下的路就没那么难走了。'
        ]
      },
      proud: {
        achievement: [
          '真为你高兴！你的坚持没有白费，这一步走得太好了。',
          '你能走到这一步，已经很了不起了。为自己骄傲吧！'
        ],
        default: [
          '干得漂亮！这份成就感是你应得的。',
          '值得庆祝！每一次进步都是你自己走出来的。'
        ]
      },
      lonely: {
        default: [
          '一个人扛着不容易。不过现在你跟我说说，我听着呢。',
          '你不是一个人。虽然看不见，但我就在这里陪你。'
        ]
      },
      joyful: {
        default: [
          '看到你开心我也高兴！好心情是最大的生产力。',
          '快乐的时候就好好享受！你值得这些美好时刻。'
        ]
      },
      neutral: {
        default: [
          '有什么想说的就说出来，我在这儿听着。',
          '咱们慢慢来，不着急。先看看今天需要做什么。'
        ]
      },
      determined: {
        default: [
          '这股劲头真好！咱们趁热打铁，把事情一件件办好。',
          '你下定决心的时候，没有什么能拦住你。'
        ]
      }
    };

    // 项目特定的共情短语覆盖
    this.projectPhrases = {
      'bridge-of-voices': {
        scenarios: ['wage_arrears', 'unfair_dismissal', 'work_injury', 'no_contract', 'overtime_dispute'],
        extra: {
          unfair_dismissal: [
            '被无故辞退是最憋屈的。但法律有明确规定，违法解除要赔2N。',
            '别让委屈压在心里。你被无故辞退，不是你的错，是对方违法。'
          ],
          work_injury: [
            '工伤不是小事。身体受了伤，赔偿一分都不能少。',
            '先养好身体，赔偿的事我们有时间去争取。工伤认定是关键一步。'
          ]
        }
      },
      'orange-jacket': {
        scenarios: ['heat_stroke', 'cold_weather', 'night_shift', 'injury'],
        extra: {
          heat_stroke: [
            '这么热的天还在外面扫，真的太不容易了。记得多喝水。',
            '高温下工作，身体才是最要紧的。不舒服就停下来休息。'
          ]
        }
      },
      'steering-wheel': {
        scenarios: ['fatigue', 'low_income', 'rude_passenger'],
        extra: {
          fatigue: [
            '累了就歇会儿，不差这一单。安全比什么都重要。',
            '你已经跑了很久了。停下来喝口水，活动活动。'
          ]
        }
      },
      'windvane': {
        scenarios: ['overtime_pressure', 'bad_weather', 'accident'],
        extra: {
          overtime_pressure: [
            '慢一点，饭晚到几分钟没关系。你的安全比准时重要一万倍。',
            '平台的时间是算法定的，你的命是自己的。别为了几分钟冒险。'
          ]
        }
      },
      'thermometer': {
        scenarios: ['burnout', 'emotional_exhaustion'],
        extra: {
          burnout: [
            '你量别人的体温，也要量自己的心。烧干了就加不满了。',
            '照顾别人之前，先照顾好自己。这不是自私，是可持续。'
          ]
        }
      },
      'threshold': {
        scenarios: ['unsafe_employer', 'contract_risk'],
        extra: {
          unsafe_employer: [
            '自己的安全最重要。任何让你不舒服的要求，你都有权拒绝。',
            '进门之后，你不是一个人。随时可以求助，随时可以离开。'
          ]
        }
      }
    };
  }

  /**
   * 生成共情回应
   * @param {Object} context - { emotion, scenario, userHistory }
   * @returns {string}
   */
  empatheticResponse(context = {}) {
    const emotion = context.emotion || 'neutral';
    const scenario = context.scenario || 'default';
    const phrases = this.empathyDB[emotion] || this.empathyDB.neutral;
    const scenarioPhrases = phrases[scenario] || phrases.default || phrases;

    // 检查项目特定覆盖
    const projPhrases = this.projectPhrases[this.projectId];
    if (projPhrases && projPhrases.extra && projPhrases.extra[scenario]) {
      const extraPhrases = projPhrases.extra[scenario];
      const pool = [...scenarioPhrases, ...extraPhrases];
      return pool[Math.floor(Math.random() * pool.length)];
    }

    return scenarioPhrases[Math.floor(Math.random() * scenarioPhrases.length)];
  }

  /**
   * 根据时段生成问候语
   * @returns {string}
   */
  timeAwareGreeting() {
    const h = new Date().getHours();
    const greetings = {
      dawn: [4, 6, '天还没亮就开始了。无论多早，总有人在默默付出。'],
      morning: [6, 9, '早上好！新的一天，新的开始。'],
      forenoon: [9, 12, '上午好！今天的事今天做完，不拖到明天。'],
      noon: [12, 14, '中午了，别忘了好好吃顿饭。身体是革命的本钱。'],
      afternoon: [14, 17, '下午好！过半了，再加把劲。'],
      evening: [17, 20, '傍晚了，今天辛苦了一天。'],
      night: [20, 22, '晚上了，该歇歇了。今天你已经做了很多。'],
      late: [22, 4, '夜深了，还在忙吗？别熬太晚，身体是自己的本钱。']
    };

    for (const [key, [start, end, msg]] of Object.entries(greetings)) {
      if (key === 'late') {
        if (h >= start || h < end) return msg;
      } else if (h >= start && h < end) {
        return msg;
      }
    }
    return '你好！有什么我可以帮你的？';
  }

  /**
   * 情绪检测（基于关键词匹配）
   * @param {string} text
   * @returns {{ primary: string, intensity: number, signals: string[] }}
   */
  detectEmotion(text) {
    if (!text || typeof text !== 'string') {
      return { primary: 'neutral', intensity: 0, signals: [] };
    }

    const emotionKeywords = {
      angry: ['气死', '太气', '愤怒', '忍不了', '过分', '欺负', '凭什么', '不公平', '欠薪', '拖欠', '克扣', '不给我', '耍赖', '无赖'],
      anxious: ['紧张', '焦虑', '担心', '害怕', '怎么办', '急', '来不及', '赶不上', '慌', '不安', '纠结'],
      tired: ['累', '疲惫', '困', '没力气', '熬', '加班', '干不动', '筋疲力尽', '受不了'],
      sad: ['难过', '伤心', '想哭', '委屈', '失望', '没希望', '绝望', '灰心', '失去', '不要我'],
      fearful: ['怕', '不敢', '报复', '威胁', '恐吓', '危险', '不安全', '保护', '躲'],
      hopeful: ['有希望', '期待', '相信', '能行', '加油', '一定', '会好的', '努力'],
      proud: ['骄傲', '自豪', '成功', '完成', '做到了', '终于', '不容易'],
      grateful: ['谢谢', '感恩', '感谢', '幸亏', '多亏', '幸好', '感激'],
      determined: ['一定', '必须', '决心', '绝不', '坚持', '无论如何', '死磕'],
      lonely: ['一个人', '没人帮', '孤立', '孤独', '没人理解', '自己扛']
    };

    let bestEmotion = 'neutral';
    let bestScore = 0;
    const allSignals = [];

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      let score = 0;
      const signals = [];
      for (const kw of keywords) {
        if (text.includes(kw)) {
          score += 1;
          signals.push(kw);
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestEmotion = emotion;
      }
      if (signals.length > 0) {
        allSignals.push(...signals);
      }
    }

    const intensity = Math.min(bestScore / 3, 1);
    return { primary: bestEmotion, intensity, signals: [...new Set(allSignals)] };
  }

  /**
   * 生成鼓励语
   * @param {string} achievement - 成就名称
   * @param {number} level - 成就等级
   * @returns {string}
   */
  encouragement(achievement, level = 1) {
    const templates = [
      `太棒了！你完成了「${achievement}」！每一步都算数。`,
      `了不起！「${achievement}」达成！你的坚持没有白费。`,
      `恭喜你！「${achievement}」是你应得的肯定。`,
      `真为你高兴！「${achievement}」——你又往前走了一步。`
    ];
    const extras = level > 1 ? ` 这是你第${level}次突破自己，越来越厉害了！` : '';
    return templates[Math.floor(Math.random() * templates.length)] + extras;
  }

  /**
   * 法律术语白话翻译
   * @param {string} term
   * @returns {string}
   */
  plainSpeak(term) {
    const dict = {
      '劳动仲裁': '去劳动局告状，让官方出面解决劳动争议',
      '劳动仲裁时效': '必须在出事之后一年内去告，超过一年可能就不管了',
      '举证责任倒置': '不用你证明老板有错，老板得证明自己没错',
      '经济补偿金': '老板辞退你时该给你的钱，一般是N个月工资',
      '赔偿金': '老板违法辞退你时该赔的钱，是经济补偿金的两倍（2N）',
      '工伤认定': '上班时受伤了，去社保局认定这是工伤，认定后医疗费和赔偿都有人管',
      '劳动监察': '劳动局的执法部门，可以直接去举报违法的老板',
      '社会保险': '五险：养老、医疗、工伤、失业、生育保险',
      '住房公积金': '公司和你各出一部分钱存进你的住房账户，买房时可以取出来用',
      '劳动合同': '你和老板签的工作协议，必须写清楚工资、工时、工作内容',
      '违法解除': '老板没有合法理由就把你开了，要赔双倍的钱',
      '加班费': '超过正常工时的额外工资，平时1.5倍，周末2倍，法定假日3倍',
      '竞业限制': '老板不让你去竞争对手那上班，但必须给你补偿金',
      '试用期': '刚入职的考察期，最长6个月，工资不能低于正式工资的80%',
      '最低工资': '法律规定老板至少该给你发多少钱，低于这个就是违法',
      '拖欠工资': '老板该发工资的时候不发，可以劳动仲裁要求支付+赔偿',
      '停工留薪期': '因工伤暂停工作期间，工资照发，老板不能不给',
      '一次性伤残补助金': '工伤鉴定出伤残等级后，社保给你的一笔补偿金',
      '职业病': '因为工作环境得的病（比如尘肺），算工伤，老板要负责',
      '集体合同': '工会代表所有工人和老板签的合同，每个人的待遇不能比这个差'
    };
    return dict[term] || term;
  }

  /**
   * 注册方言短语
   * @param {string} dialect - 方言名
   * @param {Object} phrases - { standardText: dialectText }
   */
  registerDialect(dialect, phrases) {
    this.dialects[dialect] = { ...(this.dialects[dialect] || {}), ...phrases };
  }

  /**
   * 方言翻译
   * @param {string} text
   * @param {string} dialect
   * @param {string} direction - 'toStandard' | 'toDialect'
   * @returns {string}
   */
  dialectTranslate(text, dialect, direction = 'toDialect') {
    const map = this.dialects[dialect];
    if (!map) return text;

    if (direction === 'toDialect') {
      let result = text;
      for (const [std, dial] of Object.entries(map)) {
        result = result.replace(new RegExp(std, 'g'), dial);
      }
      return result;
    } else {
      let result = text;
      for (const [std, dial] of Object.entries(map)) {
        result = result.replace(new RegExp(dial, 'g'), std);
      }
      return result;
    }
  }

  /**
   * 获取随机格言
   * @param {string} category
   * @returns {{ quote: string, author: string }}
   */
  dailyWisdom(category = 'labor') {
    const wisdoms = {
      labor: [
        { quote: '劳动者是最美的人。', author: '佚名' },
        { quote: '每一份劳动都值得被尊重，每一个劳动者都应该被保护。', author: '劳动法精神' },
        { quote: '你的汗水浇灌了这座城市，城市不该忘了你。', author: '佚名' },
        { quote: '权益不是施舍，是争取来的。', author: '佚名' },
        { quote: '团结就是力量，这不是口号，是真理。', author: '佚名' }
      ],
      resilience: [
        { quote: '天行健，君子以自强不息。', author: '《周易》' },
        { quote: '生活以痛吻我，我却报之以歌。', author: '泰戈尔' },
        { quote: '即使明天是世界末日，我也要在今天种下我的苹果树。', author: '马丁·路德' },
        { quote: '最黑暗的时刻也是最接近黎明的时候。', author: '佚名' }
      ],
      justice: [
        { quote: '法律不保护躺在权利上睡觉的人。', author: '法谚' },
        { quote: '正义可能会迟到，但绝不会缺席。', author: '佚名' },
        { quote: '让每一个人在法律面前平等。', author: '法治精神' }
      ],
      health: [
        { quote: '身体是革命的本钱。', author: '毛泽东' },
        { quote: '健康不是一切，但没有健康就没有一切。', author: '佚名' },
        { quote: '你的身体每天都在为你工作，请善待它。', author: '佚名' }
      ]
    };

    const pool = wisdoms[category] || wisdoms.labor;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * 项目工厂方法
   * @param {string} projectId
   * @returns {LangSystem}
   */
  static forProject(projectId) {
    const lang = new LangSystem(projectId);

    // 预设各项目方言
    const dialectPresets = {
      sichuan: {
        '你好': '你啷个好',
        '辛苦了': '辛苦啰',
        '注意安全': '把细点',
        '吃饭了吗': '吃没得',
        '休息一下': '歇哈儿',
        '加油': '雄起',
        '谢谢': '多谢',
        '没关系': '莫得事'
      },
      dongbei: {
        '你好': '你搁这儿呢',
        '辛苦了': '累够呛吧',
        '加油': '使劲儿整',
        '谢谢': '老感谢了',
        '没关系': '没事儿',
        '怎么办': '咋整',
        '非常好': '杠杠的'
      },
      henan: {
        '你好': '你中啊',
        '辛苦了': '辛苦啦',
        '加油': '可得劲儿',
        '谢谢': '多谢啦',
        '没关系': '木事儿',
        '怎么办': '咋弄',
        '非常好': '真中'
      }
    };

    const projectDialects = {
      'bridge-of-voices': ['sichuan', 'dongbei', 'henan'],
      'grain-rain': ['henan'],
      'iron-spine': ['sichuan'],
      'scaffold': ['sichuan'],
      'orange-jacket': ['dongbei', 'henan'],
      'threshold': ['henan'],
      'parasol': ['dongbei', 'henan', 'sichuan']
    };

    const dialects = projectDialects[projectId] || [];
    for (const d of dialects) {
      if (dialectPresets[d]) {
        lang.registerDialect(d, dialectPresets[d]);
      }
    }

    console.log(`[LangSystem] initialized for ${projectId}`);
    return lang;
  }
}

// 全局导出
if (typeof window !== 'undefined') {
  window.LangSystem = LangSystem;
}
if (typeof module !== 'undefined') {
  module.exports = LangSystem;
}
