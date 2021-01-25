/* GAMES */
// web client – app

var app = {
    ui: {
        block: Block('div', 'app'),
        init: (callback) => {
            app.ui.block.fill(document.body);
            Block.queries();
            setTimeout(_ => {
                Block.queries();
                setTimeout(_ => {
                    Block.queries();
                }, 100);
            }, 25);
            setTimeout(_ => {
                app.ui.block.css('opacity', '1');
            }, 500);
            callback();
        },
    },
    main: {
        download: (url, filename) => {
            if (confirm(`Download '${filename}'?`)) {
                app.ui.block.child('dl-mgr/dl-lnk')
                    .data({
                        href: (`${url}`).trim(),
                        target: '_blank'
                    })
                    .node().click();
            }
        },
        start: _ => {
            var main_b = app.ui.block.child('main');
            for (var type in app.main.config) {
                if (main_b.child(type) != null) {
                    var section_b = main_b.child(type);
                    for (var i in app.main.config[type].__sort) {
                        var game = app.main.config[type].__sort[i];
                        // console.log(type, game);
                        var game_config = app.main.config[type][game];
                        section_b.add(Block('game-item', game).data({
                            name: game_config.title,
                            img: `${game}.png`,
                            link: game_config.link,
                            desc: game_config.desc,
                            controls: game_config.controls,
                            year: game_config.year,
                            'alt-links': game_config['alt-links'].join(' '),
                            'preview-pos': game_config['preview-pos'],
                            'controls-lh': game_config['controls-lh']
                        }));
                    }
                }
            }
        },
        init: _ => {
            console.clear();
            console.log('[main] loading...');
            setTimeout(_ => {
                app.ui.block.load(_ => {
                    app.ui.block.load(_ => {
                        console.log('[main] blocks loaded');
                        app.ui.init(_ => {
                            console.log('[main] ready');
                            app.main.start();
                        });
                    }, 'app', 'jQuery');
                }, 'blocks', 'jQuery');
            }, 500);
        }
    }
};

$(document).ready(app.main.init);