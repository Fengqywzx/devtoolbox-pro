// 文档 HTML 渲染器
// 将结构化的文书数据渲染为格式化的 HTML
// 替代原来的纯文本输出，支持打印样式

const DocumentRenderer = {

  // === 主渲染入口 ===

  render(facts, docType, cityInfo) {
    switch (docType) {
      case 'arbitration': return this.renderArbitration(facts, cityInfo);
      case 'evidence': return this.renderEvidence(facts);
      case 'flowchart': return this.renderFlowchart(facts);
      case 'actionPlan': return this.renderActionPlan(facts, cityInfo);
      default: return this.renderArbitration(facts, cityInfo);
    }
  },

  // === 仲裁申请书 ===

  renderArbitration(facts, cityInfo) {
    const now = new Date().toLocaleDateString('zh-CN');
    const city = facts.city || this._detectCity(facts.where) || '';
    const venue = this._getVenue(city, cityInfo);

    return `
      <div class="doc-arbitration">
        <div class="doc-header">
          <h2>劳动仲裁申请书</h2>
        </div>

        <div class="doc-section">
          <h3>申请人</h3>
          <table class="doc-table">
            <tr><td class="label">姓名</td><td>${this._val(facts.who)}</td></tr>
            <tr><td class="label">联系电话</td><td>${this._empty()}（请填写）</td></tr>
            <tr><td class="label">通讯地址</td><td>${this._empty()}（请填写）</td></tr>
          </table>
        </div>

        <div class="doc-section">
          <h3>被申请人</h3>
          <table class="doc-table">
            <tr><td class="label">单位名称</td><td>${this._val(facts.whom)}</td></tr>
            <tr><td class="label">法定代表人</td><td>${this._empty()}（请填写）</td></tr>
            <tr><td class="label">单位地址</td><td>${this._val(facts.where)}</td></tr>
          </table>
        </div>

        <div class="doc-section">
          <h3>仲裁请求</h3>
          <ol class="doc-list">
            <li>请求裁决被申请人支付拖欠工资 ${this._val(facts.howMuch)} 元；</li>
            <li>请求裁决被申请人支付经济补偿金；</li>
            <li>请求裁决被申请人承担本案仲裁费用。</li>
          </ol>
        </div>

        <div class="doc-section">
          <h3>事实与理由</h3>
          <div class="doc-paragraph">
            <p>申请人于 <strong>${this._val(facts.when)}</strong> 在被申请人处开始工作，从事<strong>${this._val(facts.jobType)}</strong>工作，工作地点位于<strong>${this._val(facts.where)}</strong>。</p>
            <p>工作期间，被申请人存在以下违法行为：</p>
            <p>${this._val(facts.what)}</p>
            <p>申请人多次与被申请人沟通未果，为维护自身合法权益，现根据《中华人民共和国劳动合同法》第八十五条、《中华人民共和国劳动争议调解仲裁法》第二十七条之规定，特向贵委提出仲裁申请。</p>
          </div>
        </div>

        <div class="doc-section">
          <h3>此致</h3>
          <p class="doc-to-court">${venue}劳动人事争议仲裁委员会</p>
        </div>

        <div class="doc-section">
          <h3>证据清单</h3>
          <p>${this._val(facts.evidence)}</p>
        </div>

        <div class="doc-footer">
          <div class="doc-signature">
            <p>申请人签名：______________</p>
            <p>日期：${now}</p>
          </div>
        </div>

        ${this._renderLegalRefs(facts.legalRefs)}
      </div>
    `;
  },

  // === 证据清单 ===

  renderEvidence(facts) {
    return `
      <div class="doc-evidence">
        <div class="doc-header">
          <h2>证据清单</h2>
        </div>

        <div class="doc-section">
          <h3>案件基本信息</h3>
          <table class="doc-table">
            <tr><td class="label">申请人</td><td>${this._val(facts.who)}</td></tr>
            <tr><td class="label">被申请人</td><td>${this._val(facts.whom)}</td></tr>
            <tr><td class="label">案由</td><td>${this._caseType(facts.problemType)}</td></tr>
          </table>
        </div>

        <div class="doc-section">
          <h3>证据列表</h3>
          <table class="doc-table evidence-table">
            <thead>
              <tr><th>编号</th><th>证据名称</th><th>证明内容</th><th>备注</th></tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>身份证复印件</td><td>申请人身份</td><td>必备</td></tr>
              <tr><td>2</td><td>工牌/工服照片/工友证言</td><td>劳动关系存在</td><td>至少提供2项</td></tr>
              <tr><td>3</td><td>银行转账记录/微信转账截图</td><td>工资标准及欠薪事实</td><td>打印近6个月流水</td></tr>
              <tr><td>4</td><td>微信聊天记录截图</td><td>催要工资的沟通过程</td><td>需包含日期和对方身份</td></tr>
              <tr><td>5</td><td>工友证言（书面）</td><td>工作期间及欠薪事实</td><td>需附证人身份证复印件</td></tr>
            </tbody>
          </table>
        </div>

        <div class="doc-section doc-tips">
          <h3>证据获取建议</h3>
          <ul>
            <li><strong>微信聊天记录：</strong>截图保存，务必包含日期和对方身份信息（头像+昵称）</li>
            <li><strong>银行转账记录：</strong>去银行柜台打印流水单，免费</li>
            <li><strong>工友证言：</strong>请2-3位工友手写证词并附身份证复印件</li>
            <li><strong>工作照：</strong>保存在工作场所穿工服的照片，任何时间拍的都有用</li>
            <li><strong>拨打12333：</strong>向劳动保障监察大队投诉，他们会帮你收集部分证据</li>
          </ul>
        </div>
      </div>
    `;
  },

  // === 维权流程图 ===

  renderFlowchart(facts) {
    return `
      <div class="doc-flowchart">
        <div class="doc-header">
          <h2>劳动维权流程图</h2>
          <p class="doc-subtitle">——${facts.who ? facts.who + '的' : ''}维权行动指引</p>
        </div>

        <div class="flow-steps">
          <div class="flow-step">
            <div class="flow-number">1</div>
            <div class="flow-content">
              <h4>收集证据</h4>
              <ul>
                <li>微信聊天记录、转账记录截图保存</li>
                <li>工牌、工服、工作现场拍照</li>
                <li>联系2-3位工友愿意作证</li>
                <li>去银行打印工资流水</li>
              </ul>
              <span class="flow-time">建议立即开始</span>
            </div>
          </div>

          <div class="flow-arrow">↓</div>

          <div class="flow-step">
            <div class="flow-number">2</div>
            <div class="flow-content">
              <h4>协商 / 投诉</h4>
              <ul>
                <li>书面或微信要求老板支付欠薪</li>
                <li>拨打 <strong>12333</strong> 向劳动监察大队投诉</li>
                <li>到社区/街道人民调解委员会申请调解</li>
              </ul>
              <span class="flow-time">预计 1-2 周</span>
            </div>
          </div>

          <div class="flow-arrow">↓</div>

          <div class="flow-step">
            <div class="flow-number">3</div>
            <div class="flow-content">
              <h4>劳动仲裁（免费）</h4>
              <ul>
                <li>向当地劳动仲裁委提交申请书+证据</li>
                <li><strong>时效：</strong>知道权利受损起 <strong>1年内</strong></li>
                <li>仲裁庭 <strong>45日内</strong>作出裁决</li>
                <li>劳动争议仲裁 <strong>不收费</strong></li>
              </ul>
              <span class="flow-time">约 1-2 个月</span>
            </div>
          </div>

          <div class="flow-arrow">↓</div>

          <div class="flow-step">
            <div class="flow-number">4</div>
            <div class="flow-content">
              <h4>法院诉讼</h4>
              <ul>
                <li>对仲裁结果不服 → 15日内向法院起诉</li>
                <li>劳动争议案件诉讼费 <strong>10元</strong></li>
                <li>可申请 <strong>法律援助</strong>（免费律师）</li>
              </ul>
              <span class="flow-time">约 3-6 个月</span>
            </div>
          </div>
        </div>

        <div class="doc-tips doc-emergency">
          <h4>重要提示</h4>
          <ul>
            <li>仲裁和诉讼对劳动争议案件均免费或极低成本</li>
            <li>可拨打 <strong>12348</strong> 申请免费法律援助律师</li>
            <li><strong>证据是关键</strong>——从现在开始保存一切</li>
            <li>不要因为"金额不大"就放弃——法律保护每一位劳动者</li>
          </ul>
        </div>
      </div>
    `;
  },

  // === 行动指引 ===

  renderActionPlan(facts, cityInfo) {
    const city = facts.city || this._detectCity(facts.where) || '';
    const venue = this._getVenueInfo(city, cityInfo);
    const problemType = facts.problemType?.[0] || 'wage_arrears';
    const typeLabel = {
      wage_arrears: '拖欠工资', no_contract: '未签劳动合同',
      work_injury: '工伤', overtime: '超时加班', unfair_dismissal: '违法辞退'
    }[problemType] || '劳动争议';

    return `
      <div class="doc-action-plan">
        <div class="doc-header">
          <h2>行动指引</h2>
          <p class="doc-subtitle">${facts.who ? facts.who + ' · ' : ''}${typeLabel}维权</p>
        </div>

        <div class="doc-section">
          <h3>你要去的地方</h3>
          <div class="venue-card">
            <div class="venue-name">${venue.name}</div>
            <div class="venue-address">📍 ${venue.address}</div>
            <div class="venue-phone">📞 ${venue.phone}</div>
            <div class="venue-hours">🕐 ${venue.hours || '周一至周五 9:00-12:00 14:00-18:00'}</div>
          </div>
        </div>

        <div class="doc-section">
          <h3>你要带的材料</h3>
          <ul class="checklist">
            <li><input type="checkbox"> 身份证原件 + 复印件（2份）</li>
            <li><input type="checkbox"> 劳动仲裁申请书（本文档打印）</li>
            <li><input type="checkbox"> 证据材料（按证据清单准备）</li>
            <li><input type="checkbox"> 仲裁申请书副本（给公司的）</li>
            <li><input type="checkbox"> 银行卡（用于接收款项）</li>
          </ul>
        </div>

        <div class="doc-section">
          <h3>你要打的电话</h3>
          <table class="doc-table">
            <tr><td class="label">法律咨询</td><td><strong>12348</strong> — 免费法律援助热线</td></tr>
            <tr><td class="label">劳动保障</td><td><strong>12333</strong> — 人社服务热线</td></tr>
            <tr><td class="label">工会援助</td><td><strong>12351</strong> — 职工维权热线</td></tr>
            ${venue.phone !== '12333' ? `<tr><td class="label">本地仲裁委</td><td><strong>${venue.phone || '12333'}</strong></td></tr>` : ''}
          </table>
        </div>

        <div class="doc-section">
          <h3>关键时间节点</h3>
          <ul class="timeline">
            <li><strong>仲裁时效：</strong>知道权利受损之日起 <strong>1年内</strong>（不要等！）</li>
            <li><strong>仲裁裁决：</strong>受理后 <strong>45日内</strong>作出裁决</li>
            <li><strong>起诉期限：</strong>对裁决不服，<strong>15日内</strong>向法院起诉</li>
            ${facts.legalRefs?.map(ref => `<li><strong>${ref.law}：</strong>${ref.limitation}</li>`).join('') || ''}
          </ul>
        </div>

        <div class="doc-tips">
          <h4>最后一句话</h4>
          <p>法律保护每一位劳动者。不要因为不懂法律而放弃，不要因为对方比你强大而退缩。你手头的证据、你记下的事实，就是你最强的武器。12348 是免费的，法律援助律师是免费的——勇敢地去。</p>
        </div>
      </div>
    `;
  },

  // === 辅助方法 ===

  _val(value) {
    if (!value || value.trim() === '') {
      return '<span class="placeholder">（待补充）</span>';
    }
    return Utils.escapeHtml(value);
  },

  _empty() {
    return '<span class="placeholder">（待补充）</span>';
  },

  _detectCity(text) {
    if (!text) return '';
    const m = text.match(/([一-龥]{2,4})(?:市|区|县)/);
    return m ? m[1] : '';
  },

  _caseType(problemTypes) {
    if (!problemTypes || problemTypes.length === 0) return '劳动争议';
    const labels = {
      wage_arrears: '拖欠劳动报酬纠纷',
      no_contract: '未签劳动合同纠纷',
      work_injury: '工伤保险待遇纠纷',
      overtime: '加班费纠纷',
      unfair_dismissal: '违法解除劳动合同纠纷'
    };
    return labels[problemTypes[0]] || '劳动争议';
  },

  _getVenue(city, cityInfo) {
    if (city && cityInfo?.cities?.[city]) {
      return cityInfo.cities[city].arbitrationVenue;
    }
    return '______';
  },

  _getVenueInfo(city, cityInfo) {
    const defaultVenue = {
      name: '当地劳动人事争议仲裁委员会',
      address: '请拨打12333查询当地仲裁委地址',
      phone: '12333',
      hours: '周一至周五 9:00-12:00 14:00-18:00'
    };

    if (!city || !cityInfo?.cities?.[city]) return defaultVenue;

    const c = cityInfo.cities[city];
    return {
      name: c.arbitrationVenue,
      address: c.address,
      phone: c.phone,
      hours: c.officeHours
    };
  },

  _renderLegalRefs(refs) {
    if (!refs || refs.length === 0) return '';

    return `
      <div class="doc-section doc-legal-refs">
        <h3>适用法律依据</h3>
        ${refs.map(ref => `
          <div class="legal-ref-item">
            <p class="legal-ref-law">${Utils.escapeHtml(ref.law)}</p>
            <p class="legal-ref-content">${Utils.escapeHtml(ref.content || '')}</p>
            <p class="legal-ref-limitation">诉讼时效：${Utils.escapeHtml(ref.limitation || '1年')}</p>
          </div>
        `).join('')}
      </div>
    `;
  }
};
