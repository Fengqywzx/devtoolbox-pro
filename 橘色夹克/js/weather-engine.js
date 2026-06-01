// 天气预警引擎
// 基于用户位置 + 天气API + 环卫工人特定风险评分

class WeatherEngine {
  constructor() {
    this.apiKey = ''; // 免费OpenWeatherMap API Key
    this.city = '北京';
    this._loadPreference();
  }

  _loadPreference() {
    try {
      const saved = localStorage.getItem('oj_city');
      if (saved) this.city = saved;
    } catch {}
  }

  saveCity(city) {
    this.city = city;
    localStorage.setItem('oj_city', city);
  }

  // 获取天气数据（免费API，可替换为和风天气）
  async fetchWeather(lat = null, lon = null) {
    // 先尝试定位
    if (!lat && navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch {}
    }

    // 使用免费 wttr.in API（无需 Key）
    const url = lat
      ? `https://wttr.in/${lat},${lon}?format=j1&lang=zh`
      : `https://wttr.in/${encodeURIComponent(this.city)}?format=j1&lang=zh`;

    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!resp.ok) throw new Error('Weather fetch failed');
      const data = await resp.json();
      return this._parseWeather(data);
    } catch (e) {
      console.warn('Weather API failed:', e.message);
      return this._fallbackWeather();
    }
  }

  _parseWeather(data) {
    const current = data.current_condition?.[0] || {};
    const today = data.weather?.[0] || {};
    const hourly = today.hourly || [];

    return {
      temp: parseInt(current.temp_C) || 0,
      feelsLike: parseInt(current.FeelsLikeC) || 0,
      humidity: parseInt(current.humidity) || 0,
      windSpeed: parseInt(current.windspeedKmph) || 0,
      weatherDesc: current.lang_zh?.[0]?.value || current.weatherDesc?.[0]?.value || '未知',
      uvIndex: parseInt(current.uvIndex) || 0,
      visibility: parseInt(current.visibility) || 0,
      maxTemp: parseInt(today.maxtempC) || 0,
      minTemp: parseInt(today.mintempC) || 0,
      sunrise: today.astronomy?.[0]?.sunrise || '06:00',
      sunset: today.astronomy?.[0]?.sunset || '18:00',
      hourly: hourly.map(h => ({
        time: h.time?.slice(0,5) || '',
        temp: parseInt(h.tempC) || 0,
        rain: parseInt(h.chanceofrain) || 0,
        humidity: parseInt(h.humidity) || 0
      }))
    };
  }

  _fallbackWeather() {
    return {
      temp: 22, feelsLike: 22, humidity: 50, windSpeed: 10,
      weatherDesc: '无法获取实时数据', uvIndex: 3, visibility: 10,
      maxTemp: 25, minTemp: 15, sunrise: '06:00', sunset: '18:00',
      hourly: [], _fallback: true
    };
  }

  // 环卫工人特定风险评估
  assessRisks(weather) {
    const risks = [];
    const alerts = [];

    // 高温风险（环卫工人户外作业）
    if (weather.temp >= 40) {
      risks.push({ type: 'extreme_heat', level: 'red', score: 95 });
      alerts.push({ level: 'red', tag: '极端高温', msg: `当前${weather.temp}°C！立即停止户外作业，寻找阴凉处休息。每小时至少饮水500ml。注意中暑症状：头晕、恶心、皮肤干燥无汗。` });
    } else if (weather.temp >= 37) {
      risks.push({ type: 'high_heat', level: 'orange', score: 75 });
      alerts.push({ level: 'orange', tag: '高温橙色预警', msg: `当前${weather.temp}°C，体感${weather.feelsLike}°C。每30分钟休息一次，随身携带充足饮用水。避免11:00-15:00连续作业。` });
    } else if (weather.temp >= 35) {
      risks.push({ type: 'heat', level: 'yellow', score: 55 });
      alerts.push({ level: 'yellow', tag: '高温黄色预警', msg: `当前${weather.temp}°C。注意防晒和补水，建议佩戴遮阳帽，穿浅色透气衣物。` });
    }

    // 低温风险
    if (weather.temp <= -10) {
      risks.push({ type: 'extreme_cold', level: 'red', score: 90 });
      alerts.push({ level: 'red', tag: '极端低温', msg: `当前${weather.temp}°C！注意防冻伤，穿戴保暖手套和帽子。每40分钟进入室内取暖。手脚麻木立即就医。` });
    } else if (weather.temp <= -5) {
      alerts.push({ level: 'orange', tag: '低温预警', msg: `当前${weather.temp}°C。穿足保暖衣物，特别是手脚和耳朵。路面积冰注意防滑。` });
    }

    // 暴雨风险
    if (weather.hourly.some(h => h.rain >= 80)) {
      risks.push({ type: 'heavy_rain', level: 'orange', score: 70 });
      alerts.push({ level: 'orange', tag: '暴雨预警', msg: '未来几小时降雨概率极高。穿戴雨衣（非雨伞，影响作业），注意路面湿滑和能见度降低。避开低洼路段。' });
    } else if (weather.hourly.some(h => h.rain >= 50)) {
      alerts.push({ level: 'yellow', tag: '降雨提醒', msg: '可能有降雨，建议携带雨具。路面湿滑注意安全。' });
    }

    // 大风风险
    if (weather.windSpeed >= 50) {
      alerts.push({ level: 'red', tag: '大风预警', msg: `风速${weather.windSpeed}km/h！注意高空坠物，远离广告牌和老旧树木。` });
    }

    // 紫外线
    if (weather.uvIndex >= 8) {
      alerts.push({ level: 'orange', tag: '强紫外线', msg: `UV指数${weather.uvIndex}。暴露15分钟即可晒伤。涂抹防晒霜，戴宽檐帽。` });
    }

    // 雾霾/低能见度（环卫工人凌晨作业）
    if (weather.visibility <= 2) {
      alerts.push({ level: 'orange', tag: '低能见度', msg: `能见度仅${weather.visibility}km。穿好反光背心，确保车辆能看见你！使用手电筒或头灯。` });
    }

    return { risks, alerts };
  }

  // 生成今日作业建议
  generateAdvice(weather, risks) {
    const hour = new Date().getHours();
    let bestTimes = '';
    let avoidTimes = '';

    if (weather.temp >= 35) {
      avoidTimes = '11:00 - 15:00';
      bestTimes = '05:00 - 10:00 或 16:00 - 20:00';
    } else if (weather.temp <= -5) {
      avoidTimes = '04:00 - 08:00';
      bestTimes = '09:00 - 16:00';
    } else {
      bestTimes = '全天可作业';
      avoidTimes = '无';
    }

    return {
      canWork: risks.filter(r => r.level === 'red').length === 0,
      bestTimes,
      avoidTimes,
      waterNeeded: weather.temp >= 35 ? '至少3升' : weather.temp >= 28 ? '至少2升' : '至少1.5升',
      breakFrequency: weather.temp >= 37 ? '每30分钟' : weather.temp >= 35 ? '每45分钟' : '每60分钟',
    };
  }
}
