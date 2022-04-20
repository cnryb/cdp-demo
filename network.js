const CDP = require('chrome-remote-interface');
const puppeteer = require('puppeteer');



(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false, 
    devtools: true,
    args: ['--remote-debugging-port=9222']
  });

  // connect to endpoint
  const client = await CDP({ host: '127.0.0.1', port: 9222 });
  // extract domains
  const { Network, Page } = client;
  
  // enable events then start!
  await Network.enable();
  // await Network.setBlockedURLs({ urls: ['**/*.png'] })

  await Network.setRequestInterception({ patterns: [{ urlPattern: '*.js*', resourceType: 'Script', interceptionStage: 'HeadersReceived' },{urlPattern:'**/*.png*'}] });
  await  Network.requestIntercepted(async (params) => {
    console.log(params)
    if (params.request.url === 'https://fecdn3.zhaopin.cn/front-end/assets/logo-home.e56618.png?x-oss-process=image/resize,m_lfit,w_400') {
      await Network.continueInterceptedRequest({
        interceptionId: params.interceptionId,
        url: "https://www.baidu.com/img/PCtm_d9c8750bed0b3c7d089fa7d55720d6cf.png"
      });
    } else if(params.request.url === 'https://common-bucket.zhaopin.cn/js/zpfe-widget-sdk/zpfe-widget-sdk-1.0.0.js')
    {
      const response = await Network.getResponseBodyForInterception({ interceptionId: params.interceptionId });
      const bodyData = response.base64Encoded ? Buffer.from(response.body,'base64').toString() : response.body;
  
      const newBody = bodyData + `\nconsole.error('Executed modified resource for ${params.request.url}');
      //console.error('~~~~~~~~~~~~~~~~');
      `;
  
      const newHeaders = [
        'Connection: closed',
        'Content-Length: ' + newBody.length,
        'Content-Type: text/javascript'
      ];
  
      await Network.continueInterceptedRequest({
        interceptionId: params.interceptionId,
        rawResponse: Buffer.from('HTTP/1.1 200 OK' + '\r\n' + newHeaders.join('\r\n') + '\r\n\r\n' + newBody,'utf8').toString('base64')
      });
    }else{
     await Network.continueInterceptedRequest({
        interceptionId: params.interceptionId
      });
    }
  });

  await Page.navigate({ url: 'https://front-end.zhaopin.com' });

})();