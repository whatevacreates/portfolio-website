/* Portfolio copy of the AI Maturity Test. Scoring runs in the browser
   (a port of the backend's scoring + profile engine), nothing leaves the page:
   no API, no pixels, no email. */
(function () {
  var DIMS = ['ai-fundamentals','ai-mindset','ai-usage','prompting-competence','thinking-problem-solving','workflows-automation','innovation-use-cases','governance-ethics'];
  var Q = {
    'ai-fundamentals': ['fundamentals-capabilities','fundamentals-limitations'],
    'ai-mindset': ['mindset-curiosity','mindset-experimentation'],
    'ai-usage': ['usage-frequency','usage-breadth'],
    'prompting-competence': ['prompting-iteration','prompting-context'],
    'thinking-problem-solving': ['thinking-sparring','thinking-critique'],
    'workflows-automation': ['workflows-chaining','workflows-automation-built'],
    'innovation-use-cases': ['innovation-identifying','innovation-shipping'],
    'governance-ethics': ['governance-data-handling','governance-verification']
  };
  var NAMES = {
    'ai-fundamentals': 'AI Fundamentals', 'ai-mindset': 'AI Mindset & Learning Attitude',
    'ai-usage': 'AI Usage in Daily Work', 'prompting-competence': 'Prompting & Tool Competence',
    'thinking-problem-solving': 'AI as a Thinking & Problem-Solving Tool', 'workflows-automation': 'AI Workflows & Automation',
    'innovation-use-cases': 'AI Innovation & Use Case Implementation', 'governance-ethics': 'AI Governance, Ethics & Responsible Use'
  };
  var PROFILES = {
    'AI Explorer': { slug: 'ai-explorer', description: 'AI Explorers are at the beginning of their AI journey. They have basic awareness of artificial intelligence but only use AI tools occasionally. Their focus is mainly on understanding how AI works and exploring potential applications.', recommendations: ['Build a solid understanding of AI fundamentals','Gain first practical experience with AI tools','Identify simple use cases in daily work'] },
    'AI User': { slug: 'ai-user', description: 'AI Users regularly apply AI tools to support their work. They use AI mainly to increase productivity and simplify routine tasks.', recommendations: ['Improve prompting skills','Use AI for a broader range of tasks','Integrate AI more systematically into daily workflows'] },
    'AI Power User': { slug: 'ai-power-user', description: 'AI Power Users use AI extensively and strategically in their daily work. They understand how to obtain better results through effective prompting and actively explore advanced AI features.', recommendations: ['Combine multiple AI tools and workflows','Automate recurring tasks','Identify opportunities for AI-driven improvements in your work environment'] },
    'AI Builder': { slug: 'ai-builder', description: 'AI Builders actively design AI-supported workflows and solutions. They use AI not only to increase productivity but also to create new ways of working and solve complex problems.', recommendations: ['Build more advanced AI workflows and automations','Explore agentic systems and AI-driven processes','Scale successful use cases within teams'] },
    'AI Innovator': { slug: 'ai-innovator', description: 'AI Innovators use AI strategically to rethink processes, develop new approaches and drive innovation. They actively support others in adopting AI and contribute to shaping how AI is used within their organization.', recommendations: ['Scale AI initiatives across teams and departments','Develop new AI-driven solutions and approaches','Contribute to AI strategy and transformation'] }
  };
  var DOWNGRADE = [
    ['AI User', ['ai-fundamentals','ai-mindset','ai-usage'], 2.5, 'AI Explorer'],
    ['AI Power User', ['ai-usage','prompting-competence','thinking-problem-solving'], 3.0, 'AI User'],
    ['AI Builder', ['prompting-competence','workflows-automation','innovation-use-cases'], 3.5, 'AI Power User'],
    ['AI Innovator', ['thinking-problem-solving','workflows-automation','innovation-use-cases','governance-ethics'], 4.0, 'AI Builder']
  ];
  var INSIGHTS = [
    ['mindset-ahead-of-usage','ai-mindset',4.0,'ai-usage',3.0,'You are open and ready to learn, but not yet applying AI as consistently in your daily work as your mindset suggests.'],
    ['usage-ahead-of-governance','ai-usage',4.0,'governance-ethics',3.0,'You use AI intensively, but you should strengthen your focus on responsible and compliant AI handling.'],
    ['theory-ahead-of-practice','ai-fundamentals',4.0,'ai-usage',3.0,'You have a strong theoretical foundation, but you aren\'t fully leveraging this knowledge in your practical daily tasks yet.'],
    ['usage-ahead-of-workflows','ai-usage',4.0,'workflows-automation',3.0,'You use AI for individual tasks. Your next step is to evolve these into structured workflows and automation.']
  ];
  /* a typical peer, so the "how do you compare" radar has something to compare against */
  var PEER = { 'ai-fundamentals': 3.4, 'ai-mindset': 3.9, 'ai-usage': 3.3, 'prompting-competence': 3.1, 'thinking-problem-solving': 3.2, 'workflows-automation': 2.4, 'innovation-use-cases': 2.6, 'governance-ethics': 2.9 };
  var r2 = function (x) { return Math.round(x * 100) / 100; };
  function score(body) {
    var answers = body.answers || {}; var sec = {};
    DIMS.forEach(function (d) {
      var v = Q[d].map(function (q) { return Number(answers[q]); }).filter(function (n) { return !isNaN(n); });
      if (v.length) sec[d] = r2(v.reduce(function (a, b) { return a + b; }, 0) / v.length);
    });
    var vals = Object.keys(sec).map(function (k) { return sec[k]; });
    var overall = vals.length ? r2(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length) : 0;
    var p = overall <= 2 ? 'AI Explorer' : overall <= 3 ? 'AI User' : overall <= 4 ? 'AI Power User' : overall <= 4.5 ? 'AI Builder' : 'AI Innovator';
    DOWNGRADE.forEach(function (r) {
      if (p !== r[0]) return; var present = r[1].filter(function (d) { return d in sec; }); if (present.length < 2) return;
      var low = present.filter(function (d) { return sec[d] < r[2]; }).length; if (low >= 2) p = r[3];
    });
    var ins = INSIGHTS.filter(function (i) { return i[1] in sec && i[3] in sec && sec[i[1]] >= i[2] && sec[i[3]] <= i[4]; })
      .map(function (i) { return { id: i[0], message: i[5] }; });
    var sorted = Object.keys(sec).sort(function (a, b) { return sec[b] - sec[a]; });
    var strengths = sorted.filter(function (d) { return sec[d] >= 3; }).slice(0, 3).map(function (d) { return { id: d, name: NAMES[d] }; });
    var sids = strengths.map(function (s) { return s.id; });
    var weaknesses = sorted.slice().reverse().filter(function (d) { return sec[d] < 4 && sids.indexOf(d) < 0; }).slice(0, 3).map(function (d) { return { id: d, name: NAMES[d] }; });
    var narrative = PROFILES[p].description + (ins.length ? '\n\n' + ins.map(function (i) { return '• ' + i.message; }).join('\n') : '');
    var peerVals = DIMS.map(function (d) { return PEER[d]; }); var peerAvg = r2(peerVals.reduce(function (a, b) { return a + b; }, 0) / peerVals.length);
    var token = 'demo-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
    return {
      share_token: token, share_path: '/r/' + token, role: body.role || 'other', language: body.language || 'en', content_version: '2026-08-v1',
      overall_score: overall, section_scores: sec, persona: { slug: PROFILES[p].slug, title: p },
      strengths: strengths, weaknesses: weaknesses, insights: ins, recommendations: PROFILES[p].recommendations, narrative: narrative,
      cohort: { basis: 'all', size: 1240, percentile: Math.max(1, Math.min(99, Math.round(50 + (overall - peerAvg) * 28))), overall_average: peerAvg, dimension_averages: PEER },
      created_at: new Date().toISOString()
    };
  }
  var store = {};
  try { store = JSON.parse(sessionStorage.getItem('portfolio-maturity-results') || '{}'); } catch (e) {}
  function save() { try { sessionStorage.setItem('portfolio-maturity-results', JSON.stringify(store)); } catch (e) {} }
  var json = function (obj, status) { return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json' } }); };
  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var m = url.match(/\/ai-maturity\/results\/?(?:([^/?]+)\/?)?(email\/?)?(?:\?.*)?$/);
    if (m) {
      var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
      return new Promise(function (resolve) {
        setTimeout(function () {
          if (method === 'POST' && !m[1]) { var body = {}; try { body = JSON.parse(init.body); } catch (e) {} var res = score(body); store[res.share_token] = res; save(); resolve(json(res, 201)); }
          else if (m[2]) { resolve(json({ ok: true })); }
          else if (m[1] && store[m[1]]) { resolve(json(store[m[1]])); }
          else { resolve(json({ detail: 'This portfolio copy only keeps results for the current session.' }, 404)); }
        }, 700);
      });
    }
    if (/^https?:\/\/[^/]*(schole\.ai|azurewebsites\.net|openai|anthropic)/.test(url)) return Promise.reject(new Error('offline portfolio copy'));
    return realFetch(input, init);
  };
})();
