/* GAMES */
// web client – java

var app = {
    ui: {
        block: Block('div', 'java'),
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
    browserfs: {
        init: _ => {
            (function () {
                var mfs = new BrowserFS.FileSystem.MountableFileSystem(),
                    fs = BrowserFS.BFSRequire('fs');
                BrowserFS.initialize(mfs);
                mfs.mount('/tmp', new BrowserFS.FileSystem.InMemory());
                mfs.mount('/home', new BrowserFS.FileSystem.LocalStorage());
                mfs.mount('/sys', new BrowserFS.FileSystem.XmlHttpRequest('listings.json', 'lib/doppio'));
            })();
        }
    },
    doppio: {
        jvm: null,
        jar: null,
        load: (path, callback) => {
            console.log("[doppio] jvm initializing");
            new Doppio.VM.JVM({
                doppioHomePath: '/sys',
                classpath: [`/sys/${path}`]
            }, function (err, jvm) {
                app.doppio.jvm = jvm;
                app.doppio.jar = path;
                console.log("[doppio] jvm initialized");
                if (callback) callback();
            });
        },
        run: _ => {
            console.log(`[doppio] running jar ${app.doppio.jar}`);
            app.doppio.jvm.runJar([], function (e) {
                if (e === 0)
                    console.log("[doppio] execution succeeded");
                else console.log(`[doppio] execution failed (${e})`);
            });
        }
    },
    main: {
        init: _ => {
            console.clear();
            console.log('[main] loading...');
            app.browserfs.init();
            setTimeout(_ => {
                app.ui.block.load(_ => {
                    app.ui.block.load(_ => {
                        console.log('[main] blocks loaded');
                        app.ui.init(_ => {
                            console.log('[main] ready');
                            // app.ui.block.child('main/game/content/player').node()
                            app.doppio.load(app.main.config.path, _ => {
                                setTimeout(_ => {
                                    app.doppio.run();
                                    setTimeout(_ => {
                                        app.ui.block.on('begin');
                                    }, 200);
                                }, 600);
                            });
                        });
                    }, 'java', 'jQuery');
                }, 'blocks', 'jQuery');
            }, 600);
        }
    }
};

$(document).ready(app.main.init);