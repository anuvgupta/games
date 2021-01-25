/* GAMES */
// server

/* IMPORTS */
const fs = require("fs");
const path = require("path");
const http = require("http");
const express = require("express");
const rn = require('random-number');
const readline = require("readline");
const body_parser = require("body-parser");

/* ENVIRONMENT */
global.args = process.argv.slice(2);
global.env = global.args[0] == "prod" ? "prod" : "dev";
global.config = JSON.parse(fs.readFileSync('./config.json', { encoding: 'utf8', flag: 'r' }));
global.http_port = global.env == "dev" ? 8000 : global.config.http_port;

/* MODULES */
var utils, web, main;
// utils
utils = {
    delay: (callback, timeout) => {
        setTimeout(_ => {
            process.nextTick(callback);
        }, timeout);
    },
    rand_id: (length = 10) => {
        var key = "";
        var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (var i = 0; i < length; i++)
            key += chars[rn({
                min: 0,
                max: chars.length - 1,
                integer: true
            })];
        return key;
    },
};
// web
web = {
    express_api: null,
    http_server: null,
    cors: (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    },
    data_handle: (req, res, dir, file) => {
        var file_path = path.join(__dirname, `${dir}/${file}`);
        if (fs.existsSync(file_path)) {
            res.setHeader('content-type', 'application/octet-stream');
            res.sendFile(file_path);
        } else web.return_error(req, res, 404, `file '${file}' not found`);
    },
    return_error: (req, res, code, msg) => {
        res.status(code);
        res.setHeader('content-type', 'application/json');
        res.send(JSON.stringify({
            status: code,
            success: false,
            message: msg
        }, null, 2));
    },
    init: _ => {
        console.log("[web] initializing");
        web.express_api = express();
        web.express_api.set('view engine', 'ejs');
        web.http_server = http.Server(web.express_api);
        web.express_api.use(body_parser.json());
        web.express_api.use(body_parser.urlencoded({ extended: true }));
        web.express_api.use(web.cors);
        web.express_api.use(express.static("html"));
        web.express_api.get("/", (req, res) => {
            res.render('app', {
                config: JSON.stringify(main.replace_links_overall(global.config.games))
            });
        });
        web.express_api.get("/play/:game", (req, res) => {
            if (
                (req.params.hasOwnProperty('game') && req.params.game && req.params.game.trim() != '') ||
                (req.query.hasOwnProperty('t') && req.query.t && req.query.t.trim() != '')
            ) {
                var game = req.params.game;
                var game_type = req.query.t;
                if (global.config.games.hasOwnProperty(game_type)) {
                    var file_type = global.config.games[game_type].__type;
                    var rel_path = `data/${game_type}/${game}${file_type}`;
                    var file_path = path.join(__dirname, rel_path);
                    if (fs.existsSync(file_path) && global.config.games[game_type].hasOwnProperty(game)) {
                        res.render(game_type, {
                            id: game,
                            path: rel_path,
                            title: global.config.games[game_type][game].title,
                            config: JSON.stringify(main.replace_links(game, rel_path, global.config.games[game_type][game]))
                        });
                    } else web.return_error(req, res, 404, `game '${game}' not found`);
                } else web.return_error(req, res, 400, `invalid game type '${game_type}'`);
            } else web.return_error(req, res, 400, "missing 'game' URL parameter or 't' (type) query parameter");
        });
        web.express_api.get("/data/:game_type/:file", (req, res) => {
            if (
                (req.params.hasOwnProperty('file') && req.params.file && req.params.file.trim() != '') ||
                (req.params.hasOwnProperty('game_type') && req.params.file && req.params.file.trim() != 'game_type')
            )
                web.data_handle(req, res, `data/${req.params.game_type}`, req.params.file);
            else web.return_error(req, res, 400, "missing 'file'  or 'game_type' URL parameter");
        });
        web.express_api.listen(global.http_port, _ => {
            console.log("[web] listening on", global.http_port);
        });
    },
    exit: resolve => {
        console.log("[web] exit");
        web.http_server.close(_ => {
            if (resolve) resolve();
        });
    }
};
// main
main = {
    replace_links_overall: (config) => {
        config = JSON.parse(JSON.stringify(config));
        for (var type in config) {
            var file_type = global.config.games[type].__type;
            for (var g in config[type]) {
                if (g[0] != '_' && g[1] != '_') {
                    var rel_path = `data/${type}/${g}${file_type}`;
                    config[type][g] = main.replace_links(g, rel_path, config[type][g]);
                }
            }
        }
        return config;
    },
    replace_links: (game_id, game_rel_path, game_config) => {
        game_config = JSON.parse(JSON.stringify(game_config));
        game_config.link = main.replace_link(game_id, game_rel_path, game_config.link ? game_config.link : null);
        for (var l in game_config['alt-links']) {
            if (game_config['alt-links'].hasOwnProperty(l)) {
                game_config['alt-links'][l] = main.replace_link(game_id, game_rel_path, game_config['alt-links'][l]);
            }
        }
        return game_config;
    },
    replace_link: (game_id, game_rel_path, link = null) => {
        var type = "";
        if (link == null) return null;
        if (link.substring(0, 5) == "__dl_") {
            type = link.substring(5);
            return `dl://${game_rel_path}`;
        } else if (link.substring(0, 5) == "__pl_") {
            type = link.substring(5);
            if (type.substring(0, 3) == 'web')
                return `web://${type.substring(4)}`;
            return `${type}://${game_id}`;
        } else if (link.substring(0, 8) == "__github") {
            return `https://github.com/${global.config.github_user}/${game_id}`;
        } else if (link.substring(0, 10) == "__miniclip") {
            return `https://miniclip.com/games/${game_id}`;
        }
        return link;
    },
    main: _ => {
        console.log("[main] initializing");
        web.init();
    },
    exit: (resolve, e = 0) => {
        console.log("[main] exit");
        web.exit(_ => {
            if (resolve) resolve();
            process.exit(e);
        });
    }
};


/* MAIN */
console.log("GAMES");
process.on('exit', _ => {
    console.log('[process] exit');
});
process.on('SIGINT', _ => {
    console.log('[process] interrupt');
    main.exit();
});
process.on('SIGUSR1', _ => {
    console.log('[process] restart 1');
    main.exit();
});
process.on('SIGUSR2', _ => {
    console.log('[process] restart 2');
    main.exit();
});
utils.delay(main.main, 500);