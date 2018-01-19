function configureExitHandler(manager) {
    function exit(err) {
        if (err) {
            console.log(err);
        }
        manager.serialize(() => {
            console.log("bye");
            process.exit();
        });
    }

    //process.on('exit', exit);

    process.on('SIGINT', exit);

    process.on('SIGUSR1', exit);
    process.on('SIGUSR2', exit);

    process.on('uncaughtException', exit);
}

module.exports = configureExitHandler;