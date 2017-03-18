 function decode(p, a, c, k, e, d) {
     e = function(c) {
         return (c < a ? '' : e(parseInt(c / a))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36))
     };
     if (!''.replace(/^/, String)) {
         while (c--) {
             d[e(c)] = k[c] || e(c)
         }
         k = [function(e) {
             return d[e]
         }];
         e = function() {
             return '\\w+'
         };
         c = 1
     };
     while (c--) {
         if (k[c]) {
             p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c])
         }
     }
     return p
 }


let obj = decode('1V 2=q("2");2.1w({1v:"X%",1u:"X%",1s:"1r",1q:"D",1p:D,1o:W,1n:"3://2.7-6.1/2/q/H/q.1m.1l",1i:"16:9",1j:"D",1h:"14",15:"V",17:W,1b:"V://7-6.1/10/1a/1d/1e/1f.1g",1x:[{"s":"3:\\/\\/E.F.1\\/G?I=J.1&j=K&h=18&l=L&n=M&o=N&p=O&g=P-Q&k=R&e=m&d=20&c=S&b=5\\/4&a=1k&T=U&8=C.A.B.y&f=0&i=u&z=8,f,i,j,h,l,n,o,p,g,k,e,d,c,b,a&t=1y.1L&v=w","x":"1Q","r":"5\\/4"},{"s":"3:\\/\\/E.F.1\\/G?I=J.1&j=K&h=1R&l=L&n=M&o=N&p=O&g=P-Q&k=R&e=m&d=20&c=S&b=5\\/4&a=1S&T=U&8=C.A.B.y&f=0&i=u&z=8,f,i,j,h,l,n,o,p,g,k,e,d,c,b,a&t=1T.1U&v=w","x":"1W","r":"5\\/4"},{"s":"3:\\/\\/E.F.1\\/G?I=J.1&j=K&h=1O&l=L&n=M&o=N&p=O&g=P-Q&k=R&e=m&d=20&c=S&b=5\\/4&a=1F&T=U&8=C.A.B.y&f=0&i=u&z=8,f,i,j,h,l,n,o,p,g,k,e,d,c,b,a&t=13.1z&v=w","x":"1B","r":"5\\/4"}],r:"5/4",11:{s:"3://2.7-6.1/H/10/11.Z",1D:"3://7-6.1",},1E:"1G 1H",1I:"3://7-6.1",1J:{1K:["1N","1M","1A","1P","21"]}});2.1Z("3://2.7-6.1/2/q/H/Y.Z","12 1Y",1X(){1c.19("3://2.7-6.1/12/1t","1C")},"Y");', 62, 126, '|com|player|https|mp4|video|arab|hd|ip||lmt|mime|ei|pl|mv|ipbits|mn|itag|expire|id|ms|source||requiressl|ttl|mm|jwplayer|type|file|signature|1489630201|key|ck2|label|184|sparams|120|186|37|true|redirector|googlevideo|videoplayback|assets|app|juicyapi|5af78a63158bb51e|webdrive|yes|transient|30|sn|4g5edney|nxu|ubvJWOXWIs3LqAW14ajwBQ|mt|1489615709|http|false|100|download|png|images|logo|Download|031A0949FD2401B76D95DAAD71ADB9586A3114EC|html5|provider||autostart||open|cover|image|window|2017|02|1fbd64f2d059691b054bc00ebe5f7055|jpg|primary|aspectratio|fullscreen|1483827237241957|swf|flash|flashplayer|displaytitle|controls|preload|seven|skin|QYaME08hxfC8EVg|height|width|setup|sources|726E29FD5BE9A204AC5D9153ADA102E233EC066C|1E6433B7DD28E8328090EDA55BC3ADA2A2F633B0|email|720P|_blank|link|abouttext|1483829234666495|HD|ARAB|aboutlink|sharing|sites|A21083127B64CCA8FF60D6B1B1FF769B2E5037D0|twitter|facebook|22|googleplus|360P|59|1483829105785855|1D15CAC5F0A587CAE5612743D62B1E7642D71BCE|4775EFE2AC9ED091B8C2347DB3031C79F30BDE37|var|480P|function|Video|addButton||reddit'.split('|'), 0, {})

console.log();
