/* Portfolio copy: static page. Calls to Scholé APIs (Olé chat, share links) are cut; fonts and runtimes still load. */
(function(){var f=window.fetch.bind(window);window.fetch=function(i,o){var u=typeof i==='string'?i:(i&&i.url)||'';if(/^https?:\/\/[^/]*(schole\.ai|azurewebsites\.net|openai|anthropic)/.test(u))return Promise.reject(new Error('offline portfolio copy'));return f(i,o);};})();
