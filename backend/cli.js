const argv = require("minimist")(process.argv.slice(2));
const fs = require("fs");
const path = require("path");

const root_path = path.resolve(__dirname, "../");

function createDist(channel, version){
    // Clone a build and make a versioned copy
    const source_path = root_path + "/dist/" + channel;
    const dest_path = root_path + "/dist/" + version;

    if(!fs.existsSync(source_path)){
        console.log("Source channel not found.");
        process.exit(1);
    }

    if(fs.existsSync(dest_path)){
        console.log("Version already exists.");
        process.exit(1);
    }

    fs.cpSync(source_path, dest_path, {recursive: true});
}

function compileBuild(channel){

}

if(argv._.length === 0){
    console.log("Usage: [command] [args]");
    console.log("Commands:");
    console.log("    create-dist [source channel] [version] - Creates a new distribution for the specified version.");
    console.log("    compile-build [channel] - Compiles the build for the specified channel.");
    process.exit(0);
}

switch(argv._[0]){
    case "create-dist":
        if(argv._.length < 2){
            console.log("Usage: create-dist [source channel] [version]");
            process.exit(1);
        }

        createDist(argv._[1], argv._[2]);
        break;

    case "compile-build":
        if(argv._.length < 2){
            console.log("Usage: compile-build [channel]");
            process.exit(1);
        }

        compileBuild(argv._[1]);
        break;

    default:
        console.log("Invalid command.");
        process.exit(1);
        break;
}