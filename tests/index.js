const http = require('http');
const unzipResponse = require('unzip-response');

http.get('http://subscene.com/subtitle/download?mac=NS28FTYok6RE6hRUIPNcTP7e55bDsDiEEvd8F19SvRluQIUpl7FxcXnJZqE69V2oA7cu10Qom4vf7K5fJuHjpDAC3L1SzJiFyhJnZorpAufmAr6Sgh_7nNo0WfVcmMuI0', res => {
    res = unzipResponse(res);

    console.log(res);
});
