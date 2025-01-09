(() => {
    LS.Tiny.M.payloadSignature = function (title, dataArray = [], paddingSize = 128, base = 16){
        if(dataArray.length > paddingSize){
            throw "The length of data cannot exceed the padding size"
        }

        if(base < 16 || base > 36) throw "base must be a number between 16 and 36";

        let encoder = new TextEncoder();

        for(let i = 0; i < dataArray.length; i++){
            if(!(dataArray[i] instanceof Uint8Array) && typeof dataArray[i] !== "string") throw "Data can only be a string or an Uint8Array.";
            dataArray[i] = typeof dataArray[i] === "string"? encoder.encode(dataArray[i]): dataArray[i];
        }

        dataArray.push(crypto.getRandomValues(new Uint8Array(paddingSize - dataArray.length)));

        let data = dataArray.map(data => [...data].map(value => value.toString(base).padStart(2, "0")).join("")).join(":") + "0" + (base -1).toString(base)

        return `---signature block start "${M.uid()}${title? "-"+ title: ""}"---\n${data}\n---signature block end---`
    }

    LS.Tiny.M.parsePayloadSignature = function (signature){
        if(!signature.startsWith("---signature block start") || !signature.endsWith("\n---signature block end---")) throw "Invalid signature data";

        let header = signature.match(/---signature block start "(.*?)"---\n/)[1].split("-"), timestamp, id, instanceID;

        timestamp = parseInt(header[0], 36)
        id = parseInt(header[1], 36)
        instanceID = parseInt(header[2], 36)
        header = header[4] || null

        function decodeBody(hexString) {
            const byteArray = new Uint8Array(hexString.length / 2);

            for (let i = 0; i < hexString.length; i += 2) {
                byteArray[i / 2] = parseInt(hexString.substring(i, i + 2), base);
            }
            
            return byteArray;
        }

        let rawBody = signature.match(/['"t]---\n(.*?)\n---signature block end/s)[1], base = parseInt(rawBody.slice(-2), 36) +1;
        
        let body = rawBody.split(":").map(payload => decodeBody(payload));
        
        let padding = body.pop()

        return { header, body, padding, timestamp, id, instanceID }
    }
})