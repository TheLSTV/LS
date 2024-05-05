

/*

    NSS is a CSS preprocessor, that allows nesting, etc.
    It is currently abandoned, as ive decided to use SCSS for now.
    Might come back for it later.

*/


/*
[ls], [ls] _ {
    // ...
    :is(button, input) {
        // ...
        [ls-sharp]{
            // ...
        }
        [ls-flat]{
            // ...
        }
        [ls-fluent]{
            // ...
        }
    }
}
*/

function nss(cssString){
    let tokens = [], cs = "", co = false, mlco = false, i = -1;
    for(let s of cssString){
        i++;
        if(co){
            if((!mlco && s == "\n") || (mlco && s == "/" && cssString[i-1] == "*")){
                co=false
            }
            continue
        }
        if(s=="/" && "/*".includes(cssString[i+1])){
            co = true
            mlco = cssString[i+1]=="*"
            continue
        }
        if("\"'".includes(s)){
        }
        if("\n:{};".includes(s)){
            tokens.push(cs.trim())
            if(":{};".includes(s)){
                tokens.push(s)
            }
            cs = ""
            continue
        }
        cs+=s
    }
    tokens = tokens.filter(g => g)
    console.log(tokens);

    function parse(start) {
        let result = [],
            level = 0,
            last = ""
        ;
        function isMatch(token){
            return [["{","}"]].find(m=>m.includes(token))
        }
        for (let i=0;i<tokens.length-start;i++){
            let globalI = start+i,
                token = tokens[globalI],
                match = isMatch(token);
            if (match) {
                if (match[0] == token) {
                    level++;
                    if(level==1){
                        result.push({selector:last, props:parse(globalI+1)})
                    }
                } else {
                    level--;
                    if(level<0){
                        return result
                    }
                }
            } else {
                if(level==0){
                    if(isMatch(tokens[globalI+1])){
                        last = token
                    }else{
                        result.push(token)//_this.Parser.EvalToken(token))
                    }
                }
            }
        }
        return result
    }
    return parse(0)
}