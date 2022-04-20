const WebSocket = require('ws');
const puppeteer = require('puppeteer');

function SEND(ws, command) {
  ws.send(JSON.stringify(command));
  return new Promise(resolve => {
    ws.on('message', function (text) {
      const response = JSON.parse(text);
      if (response.id === command.id) {
        ws.removeListener('message', arguments.callee);
        resolve(response);
      }
    });
  });
}


(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: false, args: ['--remote-debugging-port=9222'] });

  const ws = new WebSocket(browser.wsEndpoint(), { perMessageDeflate: false });
  await new Promise(resolve => ws.once('open', resolve));
  // 查询所有可用的目标列表
  const targetsResponse = await SEND(ws, {
    id: 1,
    method: 'Target.getTargets',
  });

  const pageTarget = targetsResponse.result.targetInfos.find(info => info.type === 'page');
  // 连接到指定的页面
  const sessionId = (await SEND(ws, {
    id: 2,
    method: 'Target.attachToTarget',
    params: {
      targetId: pageTarget.targetId,
      flatten: true,
    },
  })).result.sessionId;

  const response = await SEND(ws, {
    sessionId,
    id: 1,  // 在一个 session 中，id 不可重复
    method: 'Runtime.evaluate',
    params: {
      expression: '1+1'
    }
  })
  console.log(JSON.stringify(response, null, 2));

})();