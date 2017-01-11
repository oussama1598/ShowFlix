const req = require("request");
const Q = require("q");

const TVST_CLIENT_ID = "UOWED7wBGRQv17skSZJO";
const TVST_CLIENT_SECRET = "ZHYcO8n8h6WbYuMDWVgXr7T571ZF_s1r1Rzu1-3B";
const TVST_USER_AGENT = "tvshowtime-plex";

const TVST_AUTHORIZE_URI = "https://api.tvshowtime.com/v1/oauth/device/code";
const TVST_ACCESS_TOKEN_URI = "https://api.tvshowtime.com/v1/oauth/access_token";
const TVST_CHECKIN_URI = "https://api.tvshowtime.com/v1/checkin";


function getCode() {
    return Q.Promise((resolve, reject) => {
        const form = { client_id: TVST_CLIENT_ID };
        const url = TVST_AUTHORIZE_URI;

        req.post({ url, form }, (err, response, body) => {
            resolve(JSON.parse(body));
        })
    })
}

function getAuth(code) {
    return Q.Promise((resolve, reject) => {
        const form = { client_id: TVST_CLIENT_ID , client_secret: TVST_CLIENT_SECRET, code};
        const url = TVST_ACCESS_TOKEN_URI;

        req.post({ url, form }, (err, response, body) => {
            resolve(JSON.parse(body));
        })
    })
}
// 9b490ec26ff5c3decfc44e5ffb2dae4f

function init() {
    getCode().then(auth_infos => {
        const { verification_url, user_code, device_code} = auth_infos;

        console.log(`Please do the following to authorize the scrobbler:\n\n1/ Connect on ${verification_url}\n2/ Enter the code: ${user_code}`);
        console.log(device_code);
        setTimeout(() => {
        	getAuth(device_code).then(access_token => {
        		console.log(access_token);
        	})
        }, 20000);

    })
}

init();

// TODO =>

// add wanted tvshows as a list and then evry x =>
// time specified by the user check if towatch list have new episode if so add it to the queue