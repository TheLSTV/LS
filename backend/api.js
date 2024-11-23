const fs = require("fs");
const { xxh32 } = require("@node-rs/xxhash");

const cache = new Map;

var Path = "/www/content/akeno/cdn",
    CompiledPath = Path + "/ls/compiled/",
    SourcePath = Path + "/ls/source/",
    DistPath = Path + "/ls/source/dist/"
;

let lsCache = new Map;


function dist(){
    // ...
}

const default_components = ["eventresolver", "default", "events"];

module.exports = {
    HandleRequest({ req, res, segments, error, backend, send }){

        // Case-insensitive
        segments = segments.map(segment => segment.toLowerCase());

        // Legacy mode had a terrible URL syntax and didnt respect versioning.
        const legacy_mode = ["js", "css", "css.min", "js.min"].indexOf(segments[0]) !== -1;

        const version = !legacy_mode? segments[0] : (segments[2]? segments[1] : null);
        
        if (legacy_mode && !segments[2]) {
            segments[2] = segments[1] || ""
        }

        const file_name = (!legacy_mode? segments[2].replace(".min", "") : "ls." + segments[0].replace(".min", "").split(".").reverse().join("."));
        const doCompress = (!legacy_mode? segments[2]: segments[0]).indexOf(".min") !== -1;

        let code = lsCache.get(file_name),
            list = !legacy_mode? segments[1].split(",") : (segments[2] ? segments[2].split(",") : ["*"])
        ;

        const type = file_name.indexOf(".js") === -1? "css": "js";

        if(!code) {
            const origin_path = DistPath + (!legacy_mode? version + "/": "4.0.0/") + file_name;
            const compiled_path = !legacy_mode? CompiledPath + file_name + "_" + version + ".json": CompiledPath + file_name + ".json";

            if (backend.isDev || !fs.existsSync(compiled_path)) {
                if (fs.existsSync(origin_path)){
                    code = ls_parse(fs.readFileSync(origin_path, "utf8"))
                    
                    fs.writeFileSync(compiled_path, JSON.stringify(code))
                    lsCache.set(compiled_path, code)
                } else return error(43)
            }

            if(!code) {
                code = JSON.parse(fs.readFileSync(compiled_path, "utf8"));
                lsCache.set(file_name, code)
            }
        }
        
        // Now we perform a tree-shake, where we only include needed components, recruisively.
        const compiled = shake(code.content, list, !list.includes("@bare"))//.replace(/\/\*\*\/|\/\*\//g, "").trim();

        send(req, res, doCompress? backend.compression.code(compiled, type === "css"): compiled, backend.isDev? "no-cache": 31536000, type === "js"? "text/javascript": type === "css"? "text/css": "text/plain")
    }
}


function shake(tree, list, defaults) {
    let result = "",
        all = list.includes("*")
    ;

    function recruisive(array) {
        if(!array) return

        for(let o of array){
            if(typeof o == "string"){
                result += o
            }else{
                if(!o.hasOwnProperty("segment") || all || list.includes(o.segment.toLowerCase()) || (defaults && default_components.includes(o.segment.toLowerCase()))){
                    recruisive(o.content)
                }
            }
        }
    }

    recruisive(tree)

    return result
}


function ls_parse(code){
    let tokens = [],
        cs = "",
        matching = false,
        matchStart = ["/*]", "//]"],
        matchEnd = ["*/"]
        matchType = "",
        skip = 0,
        matchingName = false,
        name = "",
        nameList = [],
        matchingKeyword = false,
        keywordMatch = /[[a-zA-Z#{}_]/,
        keyword = "",
        i = -1,
        variables = {}
    ;

    function stringVar(str){
        return (str||"").replace(/\$[\w\-\_]+/g, (a)=>{
            return stringVar(variables[a.replace("$", "").toLowerCase().trim()])
        })
    }

    function push(){
        if(cs){
            if(typeof tokens[tokens.length-1] == "string"){
                tokens[tokens.length-1] += cs
            }else{
                tokens.push(cs)
            }
        }
        cs = ""
    }

    //.split() is necessary since we need to split multi-symbol characters like emojis to not cause total chaos
    for(let s of code.split("")){

        // Parses the raw code (makes tokens)

        i++;

        if(skip > 0){
            skip--
            continue
        }
        if(matchingKeyword){
            if(s=="*" ||s=="(" || !keywordMatch.test(s)){
                matchingKeyword = false
                push()
                if(
                    //If a keyword should start matching an attribute
                    s == "("
                ){
                    name = ""
                    matchingName = true
                } else {
                    if( s=="*" && code[i+1] == "/" ){
                        skip++
                        matching = false
                    }
                    tokens.push({keyword})
                }
                continue
            }
            keyword += s
            continue
        }
        if(matchingName){
            if(s==")"){
                matchingName = false
                tokens.push({keyword,value: name})
                continue
            }
            name += s;
            continue
        }
        if(matching){
            if(s == "{"){
                continue
            }
            let _end = matchEnd.find((v)=>{
                return code.substring(i, i+v.length) == v
            });
            if(
                //Conditions to stop parsing attriutes
                _end ||
                (matchType == "//" && s == "\n")
            ){
                push()
                if(matchType != "//"){skip += _end.length-1}
                matching = false
                matchType = ""
                continue
            }
            if(
                //Conditions to start parsing an attribute
                keywordMatch.test(s)
            ){
                keyword = s
                matchingKeyword = true
                continue
            }
            continue
        }
        let _start = matchStart.find((v)=>{
            return code.substring(i, i+v.length) == v
        })
        if(
            //Conditions to start parsing attriutes
            _start
        ){
            matchType = _start
            push()
            skip += _start.length-1
            matching = true
            continue
        }

        cs+=s
    }

    push()
    tokens.push(cs)
    tokens = tokens.filter(g => g)
    let level = 0;

    function parse(start) {
        let result = [],
            processed = 0,
            skip = 0,
            part = ""
        ;
        function quit(){
            return [processed,  result]
        }
        for (let i=0;i<tokens.length-start;i++){
            let globalI = start+i,
                token = tokens[globalI]

            processed++;
            if(skip>0){
                skip--
                if(globalI + skip >= (tokens.length -1)){
                    return quit()
                }
                continue
            }

            if (typeof token == "object") {
                switch(token.keyword){
                    case"print":
                        result.push(stringVar(token.value.replaceAll("$name", part)))
                    break;

                    case"switch_dev":
                        let values = stringVar(token.value).split(",").map(asd => asd.trim());
                        result.push(backend.isDev? values[0] : values[1])
                    break;

                    case"mark":
                        //...
                    break;

                    case"set":
                        token.value = token.value.split(":")
                        variables[token.value.shift().toLowerCase().trim()] = token.value.join(":")
                    break;

                    case "get":
                        result.push(variables[token.value.toLowerCase().trim()])
                    break;

                    case "import": case "include":
                        if(!Array.isArray(token.value))token.value = stringVar(token.value).split(",").map(e=>
                            e.split(":").map(t=>t.trim()).filter(g=>g)
                        );

                        for(imp of token.value){
                            let isComponent = !!imp[1],
                                file = imp[0],
                                name = imp[1].replace("-", ""),
                                _result = {},
                                text = fs.readFileSync(SourcePath + file, "utf8")
                            ;

                            if(imp[2] == "-f") text = text.replace("function ", "");

                            text = (imp[2]=="js"? name + "(gl)": "") + text

                            text = text +(imp[2]=="js"?",":"");

                            if(imp[2] == "escape.template") text = text.replaceAll("`", "\\`").replaceAll("${", "$\\{");

                            let parsed = 
                                    imp[2]=="plain" ? {content:[text]} :
                                    ls_parse(
                                        text
                                    )
                            ;

                            if(parsed.components) nameList.push(...parsed.components)
                            
                            if(isComponent){
                                _result.segment = name.toLowerCase()
                                nameList.push(name)
                            }

                            _result.content = parsed.content
                            _result.from = file
                            
                            result.push(_result)
                        }

                    break;

                    case"part": case"default":
                        token.values = stringVar(token.value)
                        level++;
                        nameList.push(token.value)
                        let scope = parse(globalI + 1);
                        skip = scope[0]
                        part = token.value
                        result.push({segment: (token.value || "default").toLowerCase(), content: scope[1]})
                    break;

                    case"end": case"}":
                        level--;
                    return quit()
                    
                    case"#":

                    break;

                    default:
                        // console.warn("Unknown keyword: " + token.keyword)
                    break;
                }
            } else {
                result.push(token)
            }
        }
        return quit()
    }
    let content = parse(0)[1];
    return {components: [...new Set(nameList)].filter(g=>g).map(t=>t.toLowerCase()), content}
}