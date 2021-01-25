/* GAMES */
// web client – flash

window.RufflePlayer = window.RufflePlayer || {};

var app = {
    ui: {
        block: Block('div', 'flash'),
        init: (callback) => {
            app.ui.block.fill(document.body);
            Block.queries();
            setTimeout(_ => {
                app.ui.block.css('opacity', '1');
            }, 100);
            setTimeout(_ => {
                Block.queries();
                setTimeout(_ => {
                    Block.queries();
                }, 200);
            }, 50);
            callback();
        },
    },
    ruffle: {
        engine: null,
        player: null,
        init: (container, callback = null) => {
            console.log('[ruffle] init');
            app.ruffle.engine = window.RufflePlayer.newest();
            app.ruffle.player = app.ruffle.engine.createPlayer();
            app.ruffle.player.config = {
                autoplay: 'auto'
            };
            container.appendChild(app.ruffle.player);
            console.log('[ruffle] ready');
            if (callback) callback();
        },
        load: (swf_file) => {
            console.log(`[ruffle] loading  ${swf_file}`);
            app.ruffle.player.load(swf_file);
        }
    },
    main: {
        init: _ => {
            console.clear();
            console.log('[main] loading...');
            setTimeout(_ => {
                app.ui.block.load(_ => {
                    app.ui.block.load(_ => {
                        console.log('[main] blocks loaded');
                        app.ui.init(_ => {
                            app.ruffle.init(app.ui.block.child('main/game/content/player').node(), _ => {
                                console.log('[main] ready');
                                setTimeout(_ => {
                                    app.ruffle.load(app.main.config.path);
                                    setTimeout(_ => {
                                        app.ui.block.on('begin');
                                    }, 200);
                                }, 600);
                            });
                        });
                    }, '../flash', 'jQuery');
                }, '../blocks', 'jQuery');
            }, 600);
        }
    }
};

$(document).ready(app.main.init);